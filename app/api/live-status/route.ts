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
 *  2. Pococha自動検出 → 検出結果を返す（手動フラグは上書きしない）
 *  3. 自動検出失敗 → false
 */
export async function GET() {
  // 手動フラグ確認（管理画面のトグルでのみ変更される）
  const manualLive = await getLiveStatus();
  if (manualLive) {
    return NextResponse.json({ live: true, source: "manual" });
  }

  // Pococha自動検出（結果は手動フラグに書き込まない）
  try {
    const result = await detectPocochaLive();
    return NextResponse.json({
      live: result.live,
      source: "auto",
      method: result.method,
    });
  } catch (err) {
    console.error("Pococha live detection failed:", err);
    return NextResponse.json({ live: false, source: "fallback" });
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
