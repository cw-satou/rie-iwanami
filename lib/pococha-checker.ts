/**
 * Pococha 配信状態自動検出
 *
 * 検出手法:
 *  1. API手法: api.pococha.com/v1/profiles/shared/{uuid} を取得し
 *     レスポンスに is_live / on_air / isOnAir / isLive フィールドがあれば即判定。
 *  2. ページ手法: プロフィールページの __NEXT_DATA__ 内の live フラグを確認。
 *     ページHTMLからの文字列検索は誤検知が多いため使用しない。
 */

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

// ---------------------------------------------------------------------------
// 手法1: Pococha shared-profile API
// ---------------------------------------------------------------------------
async function checkViaApi(): Promise<boolean | null> {
  try {
    const res = await fetch(API_URL, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    if (typeof data.is_live === "boolean") return data.is_live;
    if (typeof data.on_air === "boolean") return data.on_air;
    if (typeof data.isOnAir === "boolean") return data.isOnAir;
    if (typeof data.isLive === "boolean") return data.isLive;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 手法2: プロフィールページの __NEXT_DATA__ のみ確認
// CSSクラス名やページ本文テキストは誤検知が多いため使用しない
// ---------------------------------------------------------------------------
async function checkViaPage(): Promise<boolean | null> {
  try {
    const res = await fetch(PAGE_URL, {
      headers: { ...FETCH_HEADERS, Accept: "text/html,*/*" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const html = await res.text();

    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!ndMatch) return null;

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

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 公開API: 配信状態を検出
// ---------------------------------------------------------------------------
export type LiveCheckResult = {
  live: boolean;
  method: "api_direct" | "page" | "undetermined";
};

export async function detectPocochaLive(): Promise<LiveCheckResult> {
  const apiLive = await checkViaApi();
  if (apiLive !== null) {
    return { live: apiLive, method: "api_direct" };
  }

  const pageLive = await checkViaPage();
  if (pageLive !== null) {
    return { live: pageLive, method: "page" };
  }

  return { live: false, method: "undetermined" };
}
