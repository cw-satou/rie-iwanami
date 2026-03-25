import { NextResponse } from "next/server";
import { events } from "@/lib/events";

export async function GET() {
  return NextResponse.json({ events });
}
