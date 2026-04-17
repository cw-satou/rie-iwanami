import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { updateMember, deleteMember, toPublic } from "@/lib/members";

async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { name, password, active, renewalMonth, expiresAt, lastPaymentAt, lastRenewedAt } = await request.json();

  if (password && password.length < 6) {
    return NextResponse.json({ error: "パスワードは6文字以上にしてください" }, { status: 400 });
  }

  const result = await updateMember(id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(password && { password }),
    ...(active !== undefined && { active }),
    ...(renewalMonth !== undefined && { renewalMonth: renewalMonth === null ? null : Number(renewalMonth) }),
    ...(expiresAt !== undefined && { expiresAt: expiresAt || null }),
    ...(lastPaymentAt !== undefined && { lastPaymentAt: lastPaymentAt || null }),
    ...(lastRenewedAt !== undefined && { lastRenewedAt: lastRenewedAt || null }),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ member: toPublic(result.member!) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const result = await deleteMember(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
