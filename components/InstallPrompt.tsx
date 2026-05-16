"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

// Safari の共有アイコン（box with arrow up）
function ShareIcon() {
  return (
    <svg
      className="inline w-4 h-4 mx-0.5 text-blue-500 align-text-bottom"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const p = detectPlatform();
    setPlatform(p);

    if (p === "ios") {
      setShowButton(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowButton(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (platform === "ios") {
      setShowGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).prompt();
    setDeferredPrompt(null);
    setShowButton(false);
  }

  if (installed || !showButton) return null;

  return (
    <>
      {/* 画面下部に固定表示 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        {/* iOS ガイド（ボタンタップ後に展開） */}
        {showGuide && platform === "ios" ? (
          <div className="px-4 pt-3 pb-5">
            {/* 下向きアニメーション矢印 */}
            <div className="flex flex-col items-center mb-3">
              <p className="text-xs text-gray-400 mb-1">Safari のこのボタンをタップ</p>
              <div className="animate-bounce text-pink-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Safari 共有ボタンのイメージ */}
              <div className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-xs font-medium text-gray-600">共有</span>
              </div>
            </div>

            {/* ステップ */}
            <div className="bg-pink-50 rounded-2xl px-4 py-3 space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <p className="text-sm text-gray-700">
                  画面下の<ShareIcon />をタップ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">「ホーム画面に追加」</span>を選ぶ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <p className="text-sm text-gray-700">
                  右上の<span className="font-semibold">「追加」</span>をタップして完了
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-2xl active:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="p-3">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-pink-500 text-white text-sm font-semibold py-3 px-4 rounded-2xl active:bg-pink-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              アプリをインストール
            </button>
          </div>
        )}
      </div>
    </>
  );
}
