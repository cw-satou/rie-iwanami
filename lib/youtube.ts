import { YouTubeVideo } from "./types";

// Known video IDs for Iwanami Rie
const KNOWN_VIDEOS = [
  "j7K2oROq304", // 薔薇の化身 MV
  "FVk4d8it06A", // 月の鱗 MV
  "maqTdh9KKBI", // 愛が眠るまで MV
  "LQCOiOrhupY", // こんな夜はせつなくて MV
  "-0NctQL236k", // いつも会いたくなる人
];

export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // If YouTube API key is available, use it
  if (apiKey) {
    try {
      // Search for Iwanami Rie videos
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=岩波理恵&type=video&maxResults=12&order=date&key=${apiKey}`;
      const res = await fetch(searchUrl, {
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
        }));
      }
    } catch (error) {
      console.error("YouTube API failed:", error);
    }
  }

  // Fallback: use known video IDs with oEmbed/noembed for metadata
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
      // Use basic info as fallback
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
