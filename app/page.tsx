import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { fetchNews } from "@/lib/scrape-news";
import NewsCard from "@/components/NewsCard";

// Artist photo from Tokuma Japan
const ARTIST_PHOTO = "https://www.tkma.co.jp/files/topics/2276_ext_16_0.jpg";

const menuItems = [
  { href: "/news", label: "最新ニュース", icon: "📰" },
  { href: "/events", label: "イベント情報", icon: "📅" },
  { href: "/youtube", label: "Youtube", icon: "▶️" },
  { href: "/blog", label: "個人ブログ", icon: "📝" },
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
          岩波理恵デジタルファンクラブ
        </span>
      </div>

      {/* Hero Header */}
      <header className="header-gradient px-6 pt-2 pb-10 text-center relative">
        <p className="text-white/80 text-[0.7rem] tracking-[0.2em] mb-3 font-medium">
          IWANAMI RIE DIGITAL FAN CLUB
        </p>

        {/* Artist Photo */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white/40 shadow-lg flex-shrink-0">
            <img
              src={ARTIST_PHOTO}
              alt="岩波理恵"
              className="w-full h-full object-cover object-top"
              loading="eager"
            />
          </div>
          <div className="text-left">
            <h1 className="text-white text-2xl font-bold tracking-wide">
              岩波理恵
            </h1>
            <p className="text-white/80 text-xs mt-0.5">Digital Fan Club</p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-pink-50 rounded-t-[50%]" />
      </header>

      {/* Menu Grid */}
      <div className="px-4 -mt-1">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 card-hover border border-pink-100/50 active:bg-pink-50"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-semibold text-gray-700">
                {item.label}
              </span>
            </Link>
          ))}
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
          © 2024-2026 岩波理恵デジタルファンクラブ
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
