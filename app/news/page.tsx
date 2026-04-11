"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import NewsCard from "@/components/NewsCard";
import { NewsItem } from "@/lib/types";

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadNews() {
    setLoading(true);
    setError(false);
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        setNews(data.news || data || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="ニュース" icon="📰" />

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))
        ) : news.length > 0 ? (
          news.map((item, i) => <NewsCard key={i} item={item} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {error ? "ニュースの取得に失敗しました" : "ニュースはありません"}
            </p>
            {error && (
              <button
                onClick={loadNews}
                className="mt-3 px-5 py-2 text-sm text-pink-500 border border-pink-300 rounded-full active:bg-pink-50"
              >
                再読み込み
              </button>
            )}
          </div>
        )}

        <div className="text-center py-4">
          <ExternalLink
            href="https://www.tkma.co.jp/enka_news/iwanami.html"
            title="徳間ジャパンニュース"
            className="text-sm text-pink-500 font-medium"
          >
            徳間ジャパン公式で見る →
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}
