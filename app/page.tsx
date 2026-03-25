import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { fetchNews } from "@/lib/scrape-news";
import NewsCard from "@/components/NewsCard";

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}

const menuItems: MenuItem[] = [
  { href: "/news", label: "ニュース / イベント", icon: "📰" },
  { href: "/youtube", label: "歌唱動画", icon: "🎤" },
  {
    href: "https://www.youtube.com/@rie_iwanami",
    label: "令和歌謡チャンネル",
    icon: "📺",
    external: true,
  },
  { href: "/blog", label: "個人ブログ", icon: "📝" },
  {
    href: "/agency",
    label: "事務所情報",
    icon: "🏢",
  },
  { href: "/newsletter", label: "ファンクラブ会報", icon: "📖" },
];

export const revalidate = 3600;

export default async function HomePage() {
  const news = await fetchNews();
  const latestNews = news.slice(0, 3);

  return (
    <div className="pb-20 page-enter">
      {/* Status Bar */}
      <div className="header-gradient px-4 py-2 text-center">
        <span className="text-white/90 text-xs font-medium tracking-wider">
          岩波理恵公式アプリ
        </span>
      </div>

      {/* Hero Header with Artist Photo */}
      <header className="relative">
        {/* Artist Photo - Large display */}
        <div className="relative w-full aspect-[4/5] max-h-[480px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/artist-photo.jpg"
            alt="岩波理恵"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-pink-400/90 via-pink-300/20 to-transparent" />

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-8">
            <p className="text-white/80 text-[0.65rem] tracking-[0.25em] mb-1 font-medium">
              IWANAMI RIE OFFICIAL APP
            </p>
            <h1 className="text-white text-3xl font-bold tracking-wide drop-shadow-lg">
              岩波理恵
            </h1>
            <p className="text-white/85 text-xs mt-1 font-medium">
              Official App
            </p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute -bottom-1 left-0 right-0 h-5 bg-pink-50 rounded-t-[50%]" />
      </header>

      {/* Menu Grid - 6 buttons (2 x 3) */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 card-hover border border-pink-100/50 active:bg-pink-50"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                  {item.label}
                </span>
                <span className="text-[0.6rem] text-gray-300">外部サイト</span>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 card-hover border border-pink-100/50 active:bg-pink-50"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Latest News */}
      <section className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-pink-500 rounded-full" />
          <h2 className="text-base font-bold">新着情報</h2>
        </div>
        <div className="space-y-3">
          {latestNews.length > 0 ? (
            latestNews.map((item, i) => <NewsCard key={i} item={item} />)
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              ニュースを取得中...
            </p>
          )}
        </div>
        {news.length > 3 && (
          <div className="text-center mt-4">
            <Link
              href="/news"
              className="text-sm text-pink-500 font-medium hover:underline"
            >
              すべてのニュースを見る →
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-8 px-4 pb-4 text-center">
        <p className="text-xs text-gray-300">
          © 2024-2026 岩波理恵公式アプリ
        </p>
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.65rem] text-gray-300 hover:text-gray-400"
        >
          Created with Perplexity Computer
        </a>
      </footer>

      <BottomNav />
    </div>
  );
}
