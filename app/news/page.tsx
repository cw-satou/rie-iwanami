import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import NewsCard from "@/components/NewsCard";
import { fetchNews } from "@/lib/scrape-news";

export const revalidate = 3600;

export default async function NewsPage() {
  const news = await fetchNews();

  return (
    <div className="pb-20 page-enter">
      <PageHeader title="最新ニュース" icon="📰" />

      <div className="p-4 space-y-3">
        {news.length > 0 ? (
          news.map((item, i) => <NewsCard key={i} item={item} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              ニュースを取得できませんでした
            </p>
            <p className="text-gray-300 text-xs mt-2">
              しばらくしてからお試しください
            </p>
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <a
          href="https://www.tkma.co.jp/enka_news/iwanami.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-500 font-medium"
        >
          徳間ジャパン公式で見る →
        </a>
      </div>

      <BottomNav />
    </div>
  );
}
