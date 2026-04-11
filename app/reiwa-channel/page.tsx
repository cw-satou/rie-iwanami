import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import { fetchReiwaChannelVideos, fetchReiwaShorts } from "@/lib/youtube";

export const revalidate = 3600;

export default async function ReiwaChannelPage() {
  const [videos, shorts] = await Promise.all([
    fetchReiwaChannelVideos(),
    fetchReiwaShorts(),
  ]);

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="Youtube" icon="▶️" />

      {/* Regular videos */}
      <div className="p-4 space-y-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
          >
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                sizes="430px"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">{video.title}</h3>
              {video.channelTitle && (
                <p className="text-xs text-gray-400 mt-1">{video.channelTitle}</p>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Shorts section */}
      {shorts.length > 0 && (
        <section className="px-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-pink-500 rounded-full" />
            <h2 className="text-base font-bold">ショート動画</h2>
          </div>
          {/* Horizontal scroll grid for vertical shorts */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {shorts.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/shorts/${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
              >
                {/* Vertical (9:16) thumbnail */}
                <div className="relative w-36 h-64 bg-gray-100">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="144px"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Shorts badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded">
                    Shorts
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium leading-snug line-clamp-2">{video.title}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="text-center py-4 mt-2">
        <ExternalLink
          href="https://www.youtube.com/@rie_iwanami"
          title="令和歌謡チャンネル"
          className="text-sm text-pink-500 font-medium"
        >
          チャンネルをYouTubeで見る →
        </ExternalLink>
      </div>
    </div>
  );
}
