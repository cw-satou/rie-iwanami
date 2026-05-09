import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getMember, upsertMember, addPayment } from "@/lib/member-store";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { memberNumber, paymentDate } = await req.json();
  if (!memberNumber) {
    return NextResponse.json({ error: "会員番号は必須です" }, { status: 400 });
  }

  const member = await getMember(memberNumber);
  if (!member) {
    return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
  }

  // 振込日（指定なければ今日）
  const today = paymentDate ?? new Date().toISOString().slice(0, 10);

  // 次回振込日 = 振込日の1年後
  const nextDate = new Date(today);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  const nextPaymentDate = nextDate.toISOString().slice(0, 10);

  const updated = {
    ...member,
    isActive: true,
    lastPaymentDate: today,
    nextPaymentDate,
    updatedAt: new Date().toISOString(),
  };

  await upsertMember(updated);
  // 振込履歴テーブルにも追記
  await addPayment(memberNumber, today);
  return NextResponse.json(updated);
}
