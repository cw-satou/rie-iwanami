import { NextResponse } from "next/server";
import { fetchYouTubeVideos } from "@/lib/youtube";

export const revalidate = 3600;

export async function GET() {
  const videos = await fetchYouTubeVideos();
  return NextResponse.json(videos);
}
