"use client";

import { useState } from "react";

export default function LiveToggle({ initialLive }: { initialLive: boolean }) {
  const [live, setLive] = useState(initialLive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live: !live }),
      });
      if (res.ok) {
        const data = await res.json();
        setLive(data.live);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          live ? "bg-rose-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            live ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
      <div>
        <p className={`text-sm font-semibold ${live ? "text-rose-500" : "text-gray-400"}`}>
          {live ? "配信中 🔴" : "オフライン"}
        </p>
        <p className="text-xs text-gray-400">
          {live ? "トップページに「ただいま配信中！」が表示されています" : "トップページのバナーは非表示です"}
        </p>
      </div>
    </div>
  );
}
