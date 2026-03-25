import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { newsletters } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session.loggedIn) {
    return NextResponse.json(
      { error: "会員ログインが必要です", loggedIn: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    loggedIn: true,
    memberNumber: session.memberNumber,
    newsletters,
  });
}
