import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { memberNumber, password } = body;

  if (!memberNumber || !password) {
    return NextResponse.json(
      { success: false, error: "会員番号とパスワードを入力してください" },
      { status: 400 }
    );
  }

  const result = await login(memberNumber, password);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
