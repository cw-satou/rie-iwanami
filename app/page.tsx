import Link from "next/link"; // used for menu grid and "すべてのニュース" link
import { fetchNews } from "@/lib/scrape-news";
import { fetchBlog } from "@/lib/scrape-blog";

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { href: "/news", label: "ニュース", icon: "📰" },
  { href: "/events", label: "イベント", icon: "🎵" },
  { href: "/blog", label: "個人ブログ", icon: "📝" },
  { href: "/youtube", label: "歌唱動画", icon: "🎤" },
  { href: "/reiwa-channel", label: "Youtube", icon: "▶️" },
  { href: "/agency", label: "事務所情報", icon: "🏢" },
  { href: "/newsletter", label: "ファンクラブ会報", icon: "📖" },
];

// Unified feed item
interface FeedItem {
  type: "news" | "blog";
  date: string;
  sortDate: number;
  title: string;
  icon: string;
  label: string;
  url?: string;
}

export const revalidate = 3600;

export default async function HomePage() {
  // Fetch news and blog in parallel
  const [newsItems, blogPosts] = await Promise.all([
    fetchNews(),
    fetchBlog(),
  ]);

  // Build unified feed
  const feed: FeedItem[] = [];

  // Add news
  for (const item of newsItems.slice(0, 5)) {
    feed.push({
      type: "news",
      date: item.date,
      sortDate: parseDate(item.date),
      title: item.title,
      icon: "📰",
      label: "ニュース",
      url: item.url,
    });
  }

  // Add blog
  for (const post of blogPosts.slice(0, 3)) {
    feed.push({
      type: "blog",
      date: post.date,
      sortDate: parseDate(post.date),
      title: post.title,
      icon: "📝",
      label: "ブログ",
      url: post.url,
    });
  }

  // Sort by date descending, take top 6
  feed.sort((a, b) => b.sortDate - a.sortDate);
  const latestFeed = feed.slice(0, 6);

  return (
    <div className="pb-6 page-enter">
      {/* Status Bar */}
      <div className="header-gradient px-4 py-2 text-center">
        <span className="text-white/90 text-xs font-medium tracking-wider">
          岩波理恵公式アプリ
        </span>
      </div>

      {/* Hero Header with Artist Photo */}
      <header className="relative">
        <div className="relative w-full aspect-[4/5] max-h-[480px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/artist-photo.jpg"
            alt="岩波理恵"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pink-400/90 via-pink-300/20 to-transparent" />

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

        <div className="absolute -bottom-1 left-0 right-0 h-5 bg-pink-50 rounded-t-[50%]" />
      </header>

      {/* Menu Grid - 7 buttons (2 x 3 + 1 full width) */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 card-hover border border-pink-100/50 active:bg-pink-50${idx === menuItems.length - 1 && menuItems.length % 2 !== 0 ? " col-span-2" : ""}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Feed (news + blog) */}
      <section className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-pink-500 rounded-full" />
          <h2 className="text-base font-bold">新着情報</h2>
        </div>
        <div className="space-y-3">
          {latestFeed.length > 0 ? (
            latestFeed.map((item, i) => (
              <FeedCard key={i} item={item} />
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              情報を取得中...
            </p>
          )}
        </div>
        <div className="text-center mt-4">
          <Link
            href="/news"
            className="text-sm text-pink-500 font-medium hover:underline"
          >
            すべてのニュース・イベントを見る →
          </Link>
        </div>
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

    </div>
  );
}

/* Feed card component */
function FeedCard({ item }: { item: FeedItem }) {
  const labelColors: Record<string, string> = {
    ニュース: "bg-blue-50 text-blue-600",
    イベント: "bg-red-50 text-red-600",
    ブログ: "bg-green-50 text-green-600",
  };

  const content = (
    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl card-hover border border-pink-100/50">
      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl flex-shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">{item.date}</span>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
              labelColors[item.label] || "bg-gray-50 text-gray-600"
            }`}
          >
            {item.label}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {item.title}
        </p>
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

/* Date parsing helpers */
function parseDate(dateStr: string): number {
  if (!dateStr) return 0;
  // Handle formats: "2026年02月24日", "2026/02/24", "2026-02-24"
  const cleaned = dateStr
    .replace(/年|月/g, "-")
    .replace(/日/g, "")
    .replace(/\//g, "-")
    .trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

