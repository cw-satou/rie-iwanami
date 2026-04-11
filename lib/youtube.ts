import { YouTubeVideo } from "./types";

// Known video IDs for Iwanami Rie (singing videos / MVs)
const KNOWN_VIDEOS = [
  "FVk4d8it06A", // 月の鱗 MV (2024年12月)
  "j7K2oROq304", // 薔薇の化身 MV
  "maqTdh9KKBI", // 愛が眠るまで MV
  "LQCOiOrhupY", // こんな夜はせつなくて MV
  "-0NctQL236k", // いつも会いたくなる人
];

// YouTube Shorts (@rie_iwanami) — ショート動画IDをここに追加してください
export const KNOWN_SHORTS: string[] = [
  // 例: "xxxxxxxxxxx",
];

// Reiwa Kayo Channel videos (@rie_iwanami) — 新しい順
const REIWA_CHANNEL_VIDEOS = [
  "DeE121HEfgE", // 【カバー】残酷な天使のテーゼ/高橋洋子
  "ksON_PMqwgM", // 【お知らせ】トワイライトライブin浅草
  "biF-H_0kcig", // 【カバー】あの素晴らしい愛をもう一度
  "tV1_4a-BL9g", // 【カバー】傷だらけのローラ/西城秀樹
  "zUUyQvoRYbg", // 【カバー】SWEET MEMORIES/松田聖子
  "dIkdmSPirI4", // 【カバー】恋/松山千春
  "39cHSHlfu0A", // 【カバー】メロディー/玉置浩二
];

function sortByDate(videos: YouTubeVideo[]): YouTubeVideo[] {
  return [...videos].sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=岩波理恵&type=video&maxResults=12&order=date&key=${apiKey}`;
      const res = await fetch(searchUrl, { next: { revalidate: 3600 } });

      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
        }));
        return sortByDate(videos);
      }
    } catch (error) {
      console.error("YouTube API failed:", error);
    }
  }

  // Fallback: Videos API で publishedAt を取得（1リクエスト）
  if (apiKey) {
    try {
      const ids = KNOWN_VIDEOS.join(",");
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videos = data.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
        }));
        return sortByDate(videos);
      }
    } catch (error) {
      console.error("YouTube Videos API failed:", error);
    }
  }

  // 最終フォールバック: noembed（日付なし）
  const videos: YouTubeVideo[] = [];
  for (const videoId of KNOWN_VIDEOS) {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        videos.push({
          id: videoId,
          title: data.title || `岩波理恵 - Video`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: "",
          channelTitle: data.author_name || "徳間ジャパン",
        });
      }
    } catch {
      videos.push({
        id: videoId,
        title: `岩波理恵 - Video`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: "",
      });
    }
  }
  return videos;
}

export async function fetchReiwaShorts(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=rie_iwanami&key=${apiKey}`,
        { next: { revalidate: 86400 } }
      );

      if (channelRes.ok) {
        const channelData = await channelRes.json();
        const channelId = channelData.items?.[0]?.id;

        if (channelId) {
          const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=%23shorts&type=video&videoDuration=short&maxResults=12&order=date&key=${apiKey}`,
            { next: { revalidate: 3600 } }
          );

          if (searchRes.ok) {
            const data = await searchRes.json();
            if (data.items?.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const videos = data.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail:
                  item.snippet.thumbnails.high?.url ||
                  item.snippet.thumbnails.medium?.url ||
                  item.snippet.thumbnails.default?.url,
                publishedAt: item.snippet.publishedAt,
                channelTitle: item.snippet.channelTitle,
              }));
              return sortByDate(videos);
            }
          }
        }
      }
    } catch (error) {
      console.error("YouTube Shorts API failed:", error);
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
      if (res.ok) {
        const data = await res.json();
        videos.push({
          id: videoId,
          title: data.title || "ショート動画",
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: "",
          channelTitle: data.author_name || "岩波理恵の令和歌謡チャンネル",
        });
      }
    } catch {
      videos.push({
        id: videoId,
        title: "ショート動画",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: "岩波理恵の令和歌謡チャンネル",
      });
    }
  }
  return videos;
}

export async function fetchReiwaChannelVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // YouTube Videos API で日付付きで取得
  if (apiKey) {
    try {
      const ids = REIWA_CHANNEL_VIDEOS.join(",");
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const videos = data.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
          }));
          return sortByDate(videos);
        }
      }
    } catch (error) {
      console.error("YouTube channel videos API failed:", error);
    }
  }

  // フォールバック: noembed
  const videos: YouTubeVideo[] = [];
  for (const videoId of REIWA_CHANNEL_VIDEOS) {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        videos.push({
          id: videoId,
          title: data.title || `岩波理恵 - Video`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: "",
          channelTitle: data.author_name || "岩波理恵の令和歌謡チャンネル",
        });
      }
    } catch {
      videos.push({
        id: videoId,
        title: `岩波理恵 - Video`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "",
        channelTitle: "岩波理恵の令和歌謡チャンネル",
      });
    }
  }
  return videos;
}
