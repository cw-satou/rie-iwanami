import { NextRequest, NextResponse } from "next/server";
import { getLiveStatus, setLiveStatus } from "@/lib/live-status";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET: 誰でも取得可能
export async function GET() {
  const live = await getLiveStatus();
  return NextResponse.json({ live });
}

// POST: 管理者のみ変更可能
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
