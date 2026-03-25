import { NextResponse } from "next/server";
import { fetchBlog } from "@/lib/scrape-blog";

export const revalidate = 3600;

export async function GET() {
  const posts = await fetchBlog();
  return NextResponse.json(posts);
}
