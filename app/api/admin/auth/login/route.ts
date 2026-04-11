import { NextResponse } from "next/server";
import { adminLogin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }

  const result = await adminLogin(password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
