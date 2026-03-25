import { NextResponse } from "next/server";
import { fetchReiwaChannelVideos } from "@/lib/youtube";

export const revalidate = 3600;

export async function GET() {
  const videos = await fetchReiwaChannelVideos();
  return NextResponse.json({ videos });
}
