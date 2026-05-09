import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getMembers, upsertMember, deleteMember, createBackup } from "@/lib/member-store";
import { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

// 全会員取得
export async function GET() {
  if (!(await getAdminSession())) return unauthorized();
  const members = await getMembers();
  return NextResponse.json(Object.values(members));
}

// 会員追加・更新
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const body = await req.json() as Partial<Member>;

  if (!body.memberNumber) {
    return NextResponse.json({ error: "会員番号は必須です" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const members = await getMembers();
  const existing = members[body.memberNumber];

  const member: Member = {
    memberNumber: body.memberNumber,
    name: body.name ?? existing?.name ?? "",
    email: body.email ?? existing?.email,
    password: body.password ?? existing?.password ?? "",
    isActive: body.isActive ?? existing?.isActive ?? true,
    joinDate: body.joinDate ?? existing?.joinDate ?? now.slice(0, 10),
    lastPaymentDate: body.lastPaymentDate ?? existing?.lastPaymentDate ?? null,
    nextPaymentDate: body.nextPaymentDate ?? existing?.nextPaymentDate ?? null,
    notes: body.notes ?? existing?.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await upsertMember(member);
  return NextResponse.json(member);
}

// 会員削除
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();
  const { memberNumber } = await req.json();
  if (!memberNumber) {
    return NextResponse.json({ error: "会員番号は必須です" }, { status: 400 });
  }
  await createBackup(`削除前: ${memberNumber}`);
  await deleteMember(memberNumber);
  return NextResponse.json({ ok: true });
}
