import { YouTubeVideo } from "./types";

// ミュージックビデオ用フォールバック（@tokuma_enka の既知動画ID）
const KNOWN_MV_VIDEOS = [
  "FVk4d8it06A",
  "j7K2oROq304",
  "maqTdh9KKBI",
  "LQCOiOrhupY",
  "-0NctQL236k",
];

// ショート動画フォールバック（@channel-gq1tx）
export const KNOWN_SHORTS: string[] = [];

// YouTube タブ用フォールバック（@channel-gq1tx の既知動画ID）
const KNOWN_CHANNEL_VIDEOS: string[] = [];

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

// ---- ミュージックビデオ: @tokuma_enka チャンネル ----
// タイトルに「岩波」かつ「理恵」を含む動画のみ表示
export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const channelId = await resolveChannelId("tokuma_enka", apiKey);
      if (channelId) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&order=date&key=${apiKey}`,
          { next: { revalidate: 3600 } }
        );
        if (res.ok) {
          const data = await res.json();
          const videos: YouTubeVideo[] = (data.items ?? [])
            .map((item: Parameters<typeof mapItem>[0]) => mapItem(item, true))
            .filter((v: YouTubeVideo) => v.title.includes("岩波") && v.title.includes("理恵"));
          if (videos.length > 0) return sortByDate(videos);
        }
      }
    } catch (error) {
      console.error("YouTube MV fetch failed:", error);
    }

    // フォールバック: 既知IDから取得
    try {
      const ids = KNOWN_MV_VIDEOS.join(",");
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        return sortByDate(data.items.map((item: Parameters<typeof mapItem>[0]) => mapItem(item, false)));
      }
    } catch (error) {
      console.error("YouTube Videos API fallback failed:", error);
    }
  }

  // 最終フォールバック: noembed
  const videos: YouTubeVideo[] = [];
  for (const videoId of KNOWN_MV_VIDEOS) {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
        { next: { revalidate: 86400 } }
      );
      const data = res.ok ? await res.json() : {};
      videos.push({
        id: videoId,
        title: data.title || "岩波理恵",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: data.author_name || "徳間ジャパン",
      });
    } catch {
      videos.push({
        id: videoId,
        title: "岩波理恵",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: "徳間ジャパン",
      });
    }
  }
  return videos;
}

// ---- YouTube: @channel-gq1tx の通常動画 ----
export async function fetchReiwaChannelVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const channelId = await resolveChannelId("channel-gq1tx", apiKey);
      if (channelId) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=20&order=date&key=${apiKey}`,
          { next: { revalidate: 3600 } }
        );
        if (res.ok) {
          const data = await res.json();
          const videos: YouTubeVideo[] = (data.items ?? []).map(
            (item: Parameters<typeof mapItem>[0]) => mapItem(item, true)
          );
          if (videos.length > 0) return sortByDate(videos);
        }
      }
    } catch (error) {
      console.error("YouTube channel-gq1tx videos fetch failed:", error);
    }

    if (KNOWN_CHANNEL_VIDEOS.length > 0) {
      try {
        const ids = KNOWN_CHANNEL_VIDEOS.join(",");
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`,
          { next: { revalidate: 86400 } }
        );
        if (res.ok) {
          const data = await res.json();
          return sortByDate(data.items.map((item: Parameters<typeof mapItem>[0]) => mapItem(item, false)));
        }
      } catch (error) {
        console.error("YouTube channel videos fallback failed:", error);
      }
    }
  }

  return [];
}

// ---- YouTube: @channel-gq1tx のショート動画 ----
export async function fetchReiwaShorts(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const channelId = await resolveChannelId("channel-gq1tx", apiKey);
      if (channelId) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=%23shorts&type=video&videoDuration=short&maxResults=20&order=date&key=${apiKey}`,
          { next: { revalidate: 3600 } }
        );
        if (res.ok) {
          const data = await res.json();
          const videos: YouTubeVideo[] = (data.items ?? []).map(
            (item: Parameters<typeof mapItem>[0]) => mapItem(item, true)
          );
          if (videos.length > 0) return sortByDate(videos);
        }
      }
    } catch (error) {
      console.error("YouTube channel-gq1tx shorts fetch failed:", error);
    }
  }

  if (KNOWN_SHORTS.length === 0) return [];

  const videos: YouTubeVideo[] = [];
  for (const videoId of KNOWN_SHORTS) {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/shorts/${videoId}`,
        { next: { revalidate: 86400 } }
      );
      const data = res.ok ? await res.json() : {};
      videos.push({
        id: videoId,
        title: data.title || "ショート動画",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: data.author_name || "",
      });
    } catch {
      videos.push({
        id: videoId,
        title: "ショート動画",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: "",
      });
    }
  }
  return videos;
}
