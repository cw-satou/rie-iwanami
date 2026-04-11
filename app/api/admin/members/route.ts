import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllMembers, createMember, toPublic } from "@/lib/members";

async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const members = await getAllMembers();
  return NextResponse.json({ members: members.map(toPublic) });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { memberNumber, name, password } = await request.json();

  if (!memberNumber || !name || !password) {
    return NextResponse.json({ error: "会員番号・名前・パスワードは必須です" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "パスワードは6文字以上にしてください" }, { status: 400 });
  }

  const result = await createMember(memberNumber.trim(), name.trim(), password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const { getMember } = await import("@/lib/members");
  const created = await getMember(memberNumber.trim());
  return NextResponse.json({ member: toPublic(created!) }, { status: 201 });
}
