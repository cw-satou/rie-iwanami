import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { setMembers, getMembers } from "@/lib/member-store";
import { MembersRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

// Vercel KV に残っているデータを Redis へ移行する
export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // KV 接続情報が設定されているか確認
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json(
      { error: "KV_REST_API_URL / KV_REST_API_TOKEN が設定されていません" },
      { status: 400 }
    );
  }

  let kvMembers: MembersRecord | null = null;
  try {
    // REDIS_URL の有無に関わらず、強制的に KV から読み込む
    const { kv } = await import("@vercel/kv");
    kvMembers = await kv.get<MembersRecord>("fc:members");
  } catch (err) {
    return NextResponse.json(
      { error: "KV への接続に失敗しました", detail: String(err) },
      { status: 500 }
    );
  }

  if (!kvMembers || Object.keys(kvMembers).length === 0) {
    return NextResponse.json(
      { error: "KV にデータが見つかりませんでした（すでに移行済みか、KV が空です）" },
      { status: 404 }
    );
  }

  // 現在の Redis のデータとマージ（既存データを上書きしない）
  const current = await getMembers();
  const merged: MembersRecord = { ...kvMembers, ...current };
  await setMembers(merged);

  return NextResponse.json({
    ok: true,
    migratedCount: Object.keys(kvMembers).length,
    members: Object.keys(kvMembers),
  });
}
