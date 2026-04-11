import Link from "next/link"; // used for menu grid and "すべてのニュース" link
import { fetchNews } from "@/lib/scrape-news";
import { fetchBlog } from "@/lib/scrape-blog";
import { fetchEvents } from "@/lib/scrape-events";

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { href: "/news", label: "ニュース・イベント", icon: "📰" },
  { href: "/blog", label: "個人ブログ", icon: "📝" },
  { href: "/youtube", label: "歌唱動画", icon: "🎤" },
  { href: "/reiwa-channel", label: "Youtube", icon: "▶️" },
  { href: "/live", label: "ライブ配信", icon: "📡" },
  { href: "/agency", label: "事務所情報", icon: "🏢" },
  { href: "/newsletter", label: "ファンクラブ会報", icon: "📖" },
];

// Unified feed item
interface FeedItem {
  type: "news" | "blog" | "event";
  date: string;
  sortDate: number;
  title: string;
  icon: string;
  label: string;
  url?: string;
}

export const revalidate = 3600;

export default async function HomePage() {
  // Fetch news, blog, events in parallel
  const [newsItems, blogPosts, eventItems] = await Promise.all([
    fetchNews(),
    fetchBlog(),
    fetchEvents(),
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

  // Add events
  for (const item of eventItems.slice(0, 4)) {
    feed.push({
      type: "event",
      date: item.date ?? "",
      sortDate: parseDate(item.date ?? ""),
      title: item.title,
      icon: "🎵",
      label: "イベント",
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

  // Sort by date descending, take top 8
  feed.sort((a, b) => b.sortDate - a.sortDate);
  const latestFeed = feed.slice(0, 8);

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

      {/* Menu Grid - last item always full width */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.slice(0, -1).map((item) => (
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
          ))}
          {/* Last item: full width */}
          <Link
            href={menuItems[menuItems.length - 1].href}
            className="col-span-2 bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 card-hover border border-pink-100/50 active:bg-pink-50"
          >
            <span className="text-2xl">{menuItems[menuItems.length - 1].icon}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {menuItems[menuItems.length - 1].label}
            </span>
          </Link>
        </div>
      </div>

      {/* SNS Links */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl px-5 py-3 border border-pink-100/50 flex items-center justify-center gap-6">
          <a
            href="https://x.com/Riecocoamateras"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 active:opacity-60 transition-opacity"
            aria-label="X (Twitter)"
          >
            <span className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.932-9.098-8.384-11.14h5.455l4.323 5.704L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            <span className="text-[0.6rem] text-gray-500 font-medium">X</span>
          </a>
          <a
            href="https://www.instagram.com/rie_iwanami_rie?igsh=Ynd4bTV0bG5reTBu&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 active:opacity-60 transition-opacity"
            aria-label="Instagram"
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)"}}>
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </span>
            <span className="text-[0.6rem] text-gray-500 font-medium">Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@rie_iwanami_official"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 active:opacity-60 transition-opacity"
            aria-label="TikTok"
          >
            <span className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.83 1.55V6.79a4.85 4.85 0 01-1.06-.1z"/>
              </svg>
            </span>
            <span className="text-[0.6rem] text-gray-500 font-medium">TikTok</span>
          </a>
        </div>
      </div>

      {/* Latest Feed (news + events + blog) */}
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

