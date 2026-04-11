"use client";

import { useEffect, useState } from "react";

const POCOCHA_URL =
  "https://www.pococha.com/ja-jp/app/users/56941e2a-71c1-4d91-8fc6-0385ba68ebce";

export default function LiveBanner() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/live-status");
        const data = await res.json();
        if (!cancelled) setLive(data.live === true);
      } catch {
        // ignore
      }
    }

    check();
    // 配信中かどうかを2分ごとに再確認
    const timer = setInterval(check, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!live) return null;

  return (
    <a
      href={POCOCHA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-4 mt-3 flex items-center gap-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl px-4 py-3 shadow-md active:opacity-90"
    >
      {/* 点滅ドット */}
      <span className="relative flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">ただいま配信中！</p>
        <p className="text-white/80 text-xs mt-0.5">Pocochaでライブ視聴 →</p>
      </div>
      <svg className="w-5 h-5 opacity-70 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
