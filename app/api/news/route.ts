import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/scrape-news";

export const revalidate = 3600; // ISR: revalidate every hour

export async function GET() {
  const news = await fetchNews();
  return NextResponse.json(news);
}
