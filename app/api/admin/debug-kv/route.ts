import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// KVに存在するキーを調べてデータを探す（復旧調査用）
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: "KV未設定" }, { status: 400 });
  }

  const { kv } = await import("@vercel/kv");

  // 考えられるキーをすべて調べる
  const candidateKeys = [
    "fc:members",
    "members",
    "all_members",
    "fc-members",
    "users",
  ];

  const results: Record<string, unknown> = {};
  for (const key of candidateKeys) {
    try {
      const val = await kv.get(key);
      results[key] = val;
    } catch {
      results[key] = "error";
    }
  }

  // KVのキー一覧も取得（最大100件）
  let allKeys: string[] = [];
  try {
    allKeys = await kv.keys("*");
  } catch {
    allKeys = ["keys()取得失敗"];
  }

  return NextResponse.json({ results, allKeys });
}
