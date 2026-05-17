import { YouTubeVideo } from "./types";

function sortByDate(videos: YouTubeVideo[]): YouTubeVideo[] {
  return [...videos].sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any, isSearch = true): YouTubeVideo {
  return {
    id: isSearch ? item.id.videoId : item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
    channelTitle: item.snippet.channelTitle,
  };
}

async function resolveChannelId(handle: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

// ---- ミュージックビデオ: @tokuma_enka チャンネル内を「岩波理恵」で検索 ----
export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const channelId = await resolveChannelId("tokuma_enka", apiKey);
    if (!channelId) return [];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent("岩波理恵")}&type=video&maxResults=50&order=relevance&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const videos: YouTubeVideo[] = (data.items ?? []).map(
      (item: Parameters<typeof mapItem>[0]) => mapItem(item, true)
    );
    return sortByDate(videos);
  } catch (error) {
    console.error("YouTube MV fetch failed:", error);
    return [];
  }
}

// ---- YouTube: @channel-gq1tx の通常動画（ショートを除く）----
export async function fetchReiwaChannelVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const channelId = await resolveChannelId("channel-gq1tx", apiKey);
    if (!channelId) return [];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=20&order=date&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const videos: YouTubeVideo[] = (data.items ?? []).map(
      (item: Parameters<typeof mapItem>[0]) => mapItem(item, true)
    );
    return sortByDate(videos);
  } catch (error) {
    console.error("YouTube channel-gq1tx videos fetch failed:", error);
    return [];
  }
}

// ---- YouTube: @channel-gq1tx のショート動画 ----
export async function fetchReiwaShorts(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const channelId = await resolveChannelId("channel-gq1tx", apiKey);
    if (!channelId) return [];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&videoDuration=short&maxResults=20&order=date&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const videos: YouTubeVideo[] = (data.items ?? []).map(
      (item: Parameters<typeof mapItem>[0]) => mapItem(item, true)
    );
    return sortByDate(videos);
  } catch (error) {
    console.error("YouTube channel-gq1tx shorts fetch failed:", error);
    return [];
  }
}
