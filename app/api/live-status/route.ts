import { NextRequest, NextResponse } from "next/server";
import { getLiveStatus, setLiveStatus } from "@/lib/live-status";
import { detectPocochaLive } from "@/lib/pococha-checker";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET: 配信状態を返す
 *
 * 優先順位:
 *  1. 管理者が手動でONにしていれば → 常に live: true
 *  2. Pococha自動検出 → 検出結果を返す（+ 結果をKVに同期）
 *  3. 自動検出失敗 → KVに保存された前回の状態を返す
 */
export async function GET() {
  // 手動フラグ確認
  const manualLive = await getLiveStatus();
  if (manualLive) {
    return NextResponse.json({ live: true, source: "manual" });
  }

  // Pococha自動検出
  try {
    const result = await detectPocochaLive();
    // 検出結果をKVに同期（次回の手動フォールバック用）
    if (result.method !== "undetermined") {
      await setLiveStatus(result.live);
    }
    return NextResponse.json({
      live: result.live,
      source: "auto",
      method: result.method,
    });
  } catch (err) {
    console.error("Pococha live detection failed:", err);
    // 自動検出失敗時は保存済みフラグを返す
    return NextResponse.json({ live: manualLive, source: "fallback" });
  }
}

/**
 * POST: 管理者による手動ON/OFF
 */
export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { live } = await req.json();
  if (typeof live !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await setLiveStatus(live);
  return NextResponse.json({ live });
}
