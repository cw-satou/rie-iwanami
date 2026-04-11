import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/admin-auth";

export async function POST(request: Request) {
  await adminLogout();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
