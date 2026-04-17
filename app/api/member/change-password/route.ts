import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyMemberCredentials, updateMember } from "@/lib/members";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "現在のパスワードと新しいパスワードを入力してください" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新しいパスワードは6文字以上にしてください" }, { status: 400 });
  }

  const valid = await verifyMemberCredentials(session.memberNumber, currentPassword);
  if (!valid) {
    return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
  }

  const result = await updateMember(session.memberNumber, { password: newPassword });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
