"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import { NewsItem } from "@/lib/types";

interface EventItem {
  id: string;
  month: string;
  day: string;
  weekday: string;
  name: string;
  venue: string;
  time: string;
  note: string;
}

export default function NewsEventsPage() {
  const [activeTab, setActiveTab] = useState<"news" | "events">("news");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        setNews(data.news || data || []);
        setLoadingNews(false);
      })
      .catch(() => setLoadingNews(false));

    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoadingEvents(false);
      })
      .catch(() => setLoadingEvents(false));
  }, []);

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="ニュース / イベント" icon="📰" />

      {/* Tab switcher */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex bg-pink-100/60 rounded-full p-1">
          <button
            onClick={() => setActiveTab("news")}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
              activeTab === "news"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            📰 ニュース
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
              activeTab === "events"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            📅 イベント
          </button>
        </div>
      </div>

      {/* News tab */}
      {activeTab === "news" && (
        <div className="p-4 space-y-3">
          {loadingNews ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-2xl" />
            ))
          ) : news.length > 0 ? (
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
        </div>
      )}

      {/* Events tab */}
      {activeTab === "events" && (
        <div className="p-4 space-y-3">
          {loadingEvents ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-2xl" />
            ))
          ) : events.length > 0 ? (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block bg-white rounded-2xl p-4 border border-pink-100/50 active:bg-pink-50 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Date box */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="bg-red-500 text-white text-[0.65rem] font-bold rounded-t-lg py-0.5">
                      {event.month}
                    </div>
                    <div className="bg-white border border-gray-100 rounded-b-lg py-1">
                      <div className="text-2xl font-bold text-gray-800 leading-tight">
                        {event.day}
                      </div>
                      <div className="text-[0.6rem] text-gray-400">
                        {event.weekday}
                      </div>
                    </div>
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 leading-snug">
                      {event.name}
                    </h3>
                    <div className="space-y-0.5 text-xs text-gray-500">
                      <p>📍 {event.venue}</p>
                      <p>🕐 {event.time}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center text-gray-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                現在予定されているイベントはありません
              </p>
            </div>
          )}

          <div className="text-center py-4">
            <a
              href="https://www.top-color.jp/?cat=4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-500 font-medium"
            >
              事務所のライブ情報を見る →
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
