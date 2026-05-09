import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getPaymentHistory, removePayment } from "@/lib/member-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

// 振込履歴を取得
export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const memberNumber = new URL(req.url).searchParams.get("memberNumber");
  if (!memberNumber) {
    return NextResponse.json({ error: "会員番号は必須です" }, { status: 400 });
  }

  const history = await getPaymentHistory(memberNumber);
  return NextResponse.json(history);
}

// 振込履歴から1件削除（会員レコードも再計算）
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const { memberNumber, date } = await req.json();
  if (!memberNumber || !date) {
    return NextResponse.json({ error: "会員番号と日付は必須です" }, { status: 400 });
  }

  const result = await removePayment(memberNumber, date);
  return NextResponse.json(result);
}
