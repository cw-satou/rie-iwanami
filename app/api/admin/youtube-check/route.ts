import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "no_api_key", message: "YOUTUBE_API_KEY が未設定です" });
  }

  const results: Record<string, unknown> = { apiKey: "設定済み" };

  // tokuma_enka チャンネルID解決
  try {
    const r1 = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=tokuma_enka&key=${apiKey}`
    );
    const d1 = await r1.json();
    results.tokuma_enka = {
      status: r1.status,
      channelId: d1.items?.[0]?.id ?? null,
      channelTitle: d1.items?.[0]?.snippet?.title ?? null,
      error: d1.error ?? null,
    };

    // 動画検索（上位3件のタイトルとchannelTitleを確認）
    const chId = d1.items?.[0]?.id;
    if (chId) {
      const r2 = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${chId}&type=video&maxResults=10&order=date&key=${apiKey}`
      );
      const d2 = await r2.json();
      results.tokuma_enka_videos = {
        status: r2.status,
        total: d2.pageInfo?.totalResults ?? 0,
        sample: (d2.items ?? []).slice(0, 5).map((v: { snippet: { title: string; channelTitle: string } }) => ({
          title: v.snippet.title,
          channelTitle: v.snippet.channelTitle,
        })),
        error: d2.error ?? null,
      };
    }
  } catch (e) {
    results.tokuma_enka = { error: String(e) };
  }

  // channel-gq1tx チャンネルID解決
  try {
    const r3 = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=channel-gq1tx&key=${apiKey}`
    );
    const d3 = await r3.json();
    results.channel_gq1tx = {
      status: r3.status,
      channelId: d3.items?.[0]?.id ?? null,
      channelTitle: d3.items?.[0]?.snippet?.title ?? null,
      error: d3.error ?? null,
    };
  } catch (e) {
    results.channel_gq1tx = { error: String(e) };
  }

  return NextResponse.json(results);
}
