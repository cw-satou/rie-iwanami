import { NextRequest, NextResponse } from "next/server";
import { adminLogin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }
  const ok = await adminLogin(password);
  if (!ok) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
