"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import { NewsItem, EventItem } from "@/lib/types";

type Tab = "all" | "news" | "events";

interface FeedItem {
  type: "news" | "event";
  title: string;
  date?: string;
  url?: string;
}

export default function NewsEventsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  function load() {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
      .then(([newsData, eventsData]) => {
        setNews(newsData.news ?? newsData ?? []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const feed: FeedItem[] = [
    ...news.map((n): FeedItem => ({ type: "news", title: n.title, date: n.date || undefined, url: n.url })),
    ...events.map((e): FeedItem => ({ type: "event", title: e.title, date: e.date, url: e.url })),
  ];

  const filtered =
    tab === "all"
      ? feed
      : feed.filter((f) => (tab === "news" ? f.type === "news" : f.type === "event"));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "すべて", count: feed.length },
    { key: "news", label: "ニュース", count: news.length },
    { key: "events", label: "イベント", count: events.length },
  ];

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="ニュース・イベント" icon="📰" />

      {/* Tabs */}
      <div className="px-4 mt-1">
        <div className="flex bg-white rounded-2xl border border-pink-100/50 overflow-hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "bg-pink-500 text-white"
                  : "text-gray-500 active:bg-pink-50"
              }`}
            >
              {t.label}
              {!loading && t.count > 0 && (
                <span className={`ml-1 text-[0.6rem] ${tab === t.key ? "opacity-80" : "opacity-50"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((item, i) =>
            item.url ? (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 bg-white rounded-2xl card-hover border border-pink-100/50"
              >
                <FeedRow item={item} />
              </a>
            ) : (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-pink-100/50"
              >
                <FeedRow item={item} />
              </div>
            )
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {error ? "情報の取得に失敗しました" : "情報はありません"}
            </p>
            {error && (
              <button
                onClick={load}
                className="mt-3 px-5 py-2 text-sm text-pink-500 border border-pink-300 rounded-full active:bg-pink-50"
              >
                再読み込み
              </button>
            )}
          </div>
        )}

        <div className="text-center py-4">
          <ExternalLink
            href="https://top-color.jp/?cat=121"
            title="岩波理恵イベント情報"
            className="text-sm text-pink-500 font-medium"
          >
            出演情報をすべて見る →
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const isEvent = item.type === "event";
  return (
    <>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
          isEvent ? "bg-red-50" : "bg-blue-50"
        }`}
      >
        {isEvent ? "🎵" : "📰"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ${
              isEvent ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {isEvent ? "イベント" : "ニュース"}
          </span>
          {item.date && (
            <span className="text-xs text-gray-400">{item.date}</span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
        {item.url && (
          <span className="text-xs text-pink-500 mt-1 inline-block">
            詳細を見る →
          </span>
        )}
      </div>
    </>
  );
}
