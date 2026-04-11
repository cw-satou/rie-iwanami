import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import { fetchYouTubeVideos } from "@/lib/youtube";

export const revalidate = 3600;

export default async function YoutubePage() {
  const videos = await fetchYouTubeVideos();

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="Youtube" icon="▶️" />

      <div className="p-4 space-y-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                sizes="430px"
                loading="lazy"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Video info */}
            <div className="p-3">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">
                {video.title}
              </h3>
              {video.channelTitle && (
                <p className="text-xs text-gray-400 mt-1">
                  {video.channelTitle}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="text-center py-4">
        <ExternalLink
          href="https://www.youtube.com/@channel-gq1tx"
          title="YouTubeチャンネル"
          className="text-sm text-pink-500 font-medium"
        >
          YouTubeチャンネルを見る →
        </ExternalLink>
      </div>

    </div>
  );
}
