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
    <div className="pb-[80px] page-enter">
      {/* Status Bar */}
      <div className="header-gradient px-[16px] py-[8px] text-center">
        <span className="text-white/90 text-[12px] font-medium tracking-wider">
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
          <div className="absolute bottom-0 left-0 right-0 px-[20px] pb-[32px]">
            <p className="text-white/80 text-[11px] tracking-[0.25em] mb-[4px] font-medium">
              IWANAMI RIE OFFICIAL APP
            </p>
            <h1 className="text-white text-[30px] font-bold tracking-wide drop-shadow-lg">
              岩波理恵
            </h1>
            <p className="text-white/85 text-[12px] mt-[4px] font-medium">
              Official App
            </p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute -bottom-1 left-0 right-0 h-5 bg-pink-50 rounded-t-[50%]" />
      </header>

      {/* Menu Grid - 6 buttons (2 x 3) */}
      <div className="px-[16px] mt-[8px]">
        <div className="grid grid-cols-2 gap-[12px]">
          {menuItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl py-[16px] px-[8px] flex flex-col items-center gap-[6px] card-hover border border-pink-100/50 active:bg-pink-50"
              >
                <span className="text-[28px] leading-none">{item.icon}</span>
                <span className="text-[13px] font-semibold text-gray-700 text-center leading-tight">
                  {item.label}
                </span>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl py-[16px] px-[8px] flex flex-col items-center gap-[6px] card-hover border border-pink-100/50 active:bg-pink-50"
              >
                <span className="text-[28px] leading-none">{item.icon}</span>
                <span className="text-[13px] font-semibold text-gray-700 text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Latest News */}
      <section className="px-[16px] mt-[24px]">
        <div className="flex items-center gap-[8px] mb-[12px]">
          <div className="w-[4px] h-[20px] bg-pink-500 rounded-full" />
          <h2 className="text-[16px] font-bold">新着情報</h2>
        </div>
        <div className="space-y-[12px]">
          {latestNews.length > 0 ? (
            latestNews.map((item, i) => <NewsCard key={i} item={item} />)
          ) : (
            <p className="text-[14px] text-gray-400 text-center py-[32px]">
              ニュースを取得中...
            </p>
          )}
        </div>
        {news.length > 3 && (
          <div className="text-center mt-[16px]">
            <Link
              href="/news"
              className="text-[14px] text-pink-500 font-medium hover:underline"
            >
              すべてのニュースを見る →
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-[32px] px-[16px] pb-[16px] text-center">
        <p className="text-[11px] text-gray-300">
          © 2024-2026 岩波理恵公式アプリ
        </p>
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-300 hover:text-gray-400"
        >
          Created with Perplexity Computer
        </a>
      </footer>

      <BottomNav />
    </div>
  );
}
