import { NextResponse } from "next/server";
import { fetchEvents } from "@/lib/scrape-events";

export const revalidate = 3600;

export async function GET() {
  const events = await fetchEvents();
  return NextResponse.json(events);
}
