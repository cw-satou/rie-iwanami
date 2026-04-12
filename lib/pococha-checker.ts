/**
 * Pococha 配信状態自動検出
 *
 * 検出手法（Pythonスクリプトのロジックを参考にTypeScript移植）:
 *  1. API手法: api.pococha.com/v1/profiles/shared/{uuid} を取得し
 *     レスポンスに isOnAir / on_air / is_live フィールドがあれば即判定。
 *     ない場合は live_tags ハッシュを前回値（KV保存）と比較して変化を検出。
 *  2. ページ手法: プロフィールページのHTMLを取得し
 *     __NEXT_DATA__ の isOnAir / on_air / isLive を確認。
 *     ページ本文から「配信中」「ライブ中」テキストも確認。
 */

import { createHash } from "crypto";

const POCOCHA_UUID = "56941e2a-71c1-4d91-8fc6-0385ba68ebce";
const API_URL = `https://api.pococha.com/v1/profiles/shared/${POCOCHA_UUID}`;
const PAGE_URL = `https://www.pococha.com/app/users/${POCOCHA_UUID}`;

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Mobile Safari/537.36";

const FETCH_HEADERS = {
  "User-Agent": MOBILE_UA,
  Accept: "application/json, text/html, */*",
  "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
  Referer: "https://www.pococha.com",
};

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

function tagsHash(tags: unknown[]): string {
  const raw = JSON.stringify(tags ?? []);
  return createHash("md5").update(raw).digest("hex");
}

// ---------------------------------------------------------------------------
// KV helpers for baseline tags hash
// ---------------------------------------------------------------------------
let memTagsHash = "";

async function getStoredHash(): Promise<string> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<string>("pococha_tags_hash")) ?? "";
  }
  return memTagsHash;
}

async function setStoredHash(hash: string): Promise<void> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("pococha_tags_hash", hash);
  } else {
    memTagsHash = hash;
  }
}

// ---------------------------------------------------------------------------
// 手法1: Pococha shared-profile API
// ---------------------------------------------------------------------------
async function checkViaApi(): Promise<{
  live: boolean | null; // null = 判定不能
  tagsChanged: boolean;
}> {
  try {
    const res = await fetch(API_URL, {
      headers: FETCH_HEADERS,
      // Next.js の fetch キャッシュを無効化して常に最新を取得
      cache: "no-store",
    });
    if (!res.ok) return { live: null, tagsChanged: false };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // 直接ライブフラグがあれば即判定
    if (typeof data.is_live === "boolean") return { live: data.is_live, tagsChanged: false };
    if (typeof data.on_air === "boolean") return { live: data.on_air, tagsChanged: false };
    if (typeof data.isOnAir === "boolean") return { live: data.isOnAir, tagsChanged: false };
    if (typeof data.isLive === "boolean") return { live: data.isLive, tagsChanged: false };

    // live_tags ハッシュ変化検出
    const currentHash = tagsHash(data.live_tags ?? []);
    const storedHash = await getStoredHash();

    // 初回 or ハッシュ未設定 → ベースライン保存のみ
    if (!storedHash) {
      await setStoredHash(currentHash);
      return { live: null, tagsChanged: false };
    }

    const changed = currentHash !== storedHash;
    if (changed) {
      await setStoredHash(currentHash);
    }
    return { live: null, tagsChanged: changed };
  } catch {
    return { live: null, tagsChanged: false };
  }
}

// ---------------------------------------------------------------------------
// 手法2: プロフィールページの __NEXT_DATA__ とテキストを確認
// ---------------------------------------------------------------------------
async function checkViaPage(): Promise<boolean | null> {
  try {
    const res = await fetch(PAGE_URL, {
      headers: { ...FETCH_HEADERS, Accept: "text/html,*/*" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const html = await res.text();

    // __NEXT_DATA__ 内の live フラグを確認
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (ndMatch) {
      const ndJson = ndMatch[1];
      if (
        ndJson.includes('"isOnAir":true') ||
        ndJson.includes('"on_air":true') ||
        ndJson.includes('"isLive":true') ||
        ndJson.includes('"is_live":true')
      ) {
        return true;
      }
      if (
        ndJson.includes('"isOnAir":false') ||
        ndJson.includes('"on_air":false') ||
        ndJson.includes('"isLive":false') ||
        ndJson.includes('"is_live":false')
      ) {
        return false;
      }
    }

    // ページ本文テキストから配信中キーワードを確認
    // liveTag 系の静的クラスは無視する（スクリプトの FALSE_POSITIVE_CLASSES 相当）
    // class="...liveTag..." の中のテキストを除外するため、
    // liveTag 要素を除いた後にキーワード検索
    const htmlNoLiveTags = html.replace(/class="[^"]*liveTag[^"]*"[\s\S]*?<\/[a-z]+>/g, "");
    const liveKeywords = ["配信中", "ライブ中", "LIVE中", "放送中"];
    for (const kw of liveKeywords) {
      if (htmlNoLiveTags.includes(kw)) {
        return true;
      }
    }

    // 配信中を示すCSSクラス名
    const liveCssPatterns = [
      "liveNow",
      "live-badge",
      "liveBadge",
      "onAir",
      "on-air",
      "liveContainer",
      "liveScreen",
    ];
    for (const cls of liveCssPatterns) {
      if (html.includes(cls)) {
        return true;
      }
    }

    return false;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 公開API: 配信状態を検出
// ---------------------------------------------------------------------------
export type LiveCheckResult = {
  live: boolean;
  method: "api_direct" | "page" | "tags_change" | "undetermined";
};

export async function detectPocochaLive(): Promise<LiveCheckResult> {
  // 手法1: API
  const { live: apiLive, tagsChanged } = await checkViaApi();

  if (apiLive !== null) {
    return { live: apiLive, method: "api_direct" };
  }

  // 手法2: ページ確認（APIで直接判定できなかった場合、または変化検出時）
  const pageLive = await checkViaPage();

  if (pageLive !== null) {
    return { live: pageLive, method: "page" };
  }

  // ページでも判定不能 → live_tags 変化があれば「配信中の可能性あり」
  if (tagsChanged) {
    return { live: true, method: "tags_change" };
  }

  return { live: false, method: "undetermined" };
}
