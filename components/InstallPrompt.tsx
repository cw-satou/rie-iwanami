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

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
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

    // Android / Chrome desktop
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
      setShowIosGuide(true);
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
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 bg-pink-500 text-white text-sm font-semibold py-3 px-4 rounded-2xl active:bg-pink-600 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
        </svg>
        アプリをインストール
      </button>

      {/* iOS guide modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowIosGuide(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <h2 className="text-base font-bold text-center">ホーム画面に追加する方法</h2>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <p className="text-sm text-gray-600">
                  画面下部の
                  <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                    <svg className="w-3.5 h-3.5 mr-0.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    共有
                  </span>
                  ボタンをタップ
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <p className="text-sm text-gray-600">
                  メニューをスクロールして
                  <span className="font-semibold text-gray-800">「ホーム画面に追加」</span>
                  をタップ
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <p className="text-sm text-gray-600">
                  右上の
                  <span className="font-semibold text-gray-800">「追加」</span>
                  をタップして完了
                </p>
              </li>
            </ol>
            <p className="text-xs text-gray-400 text-center">※ Safari でのみ利用できます</p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 bg-pink-500 text-white text-sm font-semibold rounded-2xl active:bg-pink-600"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
