"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import { EventItem } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadEvents() {
    setLoading(true);
    setError(false);
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: EventItem[]) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="イベント" icon="🎵" />

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))
        ) : events.length > 0 ? (
          events.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl p-4 card-hover border border-pink-100/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl flex-shrink-0">
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-3">
                    {item.title}
                  </p>
                  <span className="text-xs text-pink-500 mt-1.5 inline-block font-medium">
                    詳細を見る →
                  </span>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {error ? "イベント情報の取得に失敗しました" : "イベント情報はありません"}
            </p>
            {error && (
              <button
                onClick={loadEvents}
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
