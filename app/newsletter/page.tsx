"use client";

import { useEffect, useState, useRef, useCallback, useId, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";

interface NewsletterPreview {
  id: string;
  vol: string;
  issue: string;
  title: string;
  gradient: string;
  coverImage: string;
  totalPages?: number;
  pages?: string[];
}

export default function NewsletterPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const [newsletters, setNewsletters] = useState<NewsletterPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNl, setSelectedNl] = useState<NewsletterPreview | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const zoomDialogId = useId();

  // Password change form state
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Swipe state for reader
  const swipeRef = useRef<{ startX: number; startY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    moved: false,
  });

  // Zoom touch state
  const touchRef = useRef<{
    lastDist: number;
    lastX: number;
    lastY: number;
    startScale: number;
    startX: number;
    startY: number;
    isPinching: boolean;
    isDragging: boolean;
  }>({
    lastDist: 0,
    lastX: 0,
    lastY: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    isPinching: false,
    isDragging: false,
  });

  const openZoom = useCallback(() => {
    setZoomScale(1);
    setZoomPos({ x: 0, y: 0 });
    setZoomOpen(true);
  }, []);

  const closeZoom = useCallback(() => {
    setZoomOpen(false);
    setZoomScale(1);
    setZoomPos({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
        touchRef.current.startScale = zoomScale;
        touchRef.current.isPinching = true;
        touchRef.current.isDragging = false;
      } else if (e.touches.length === 1 && zoomScale > 1) {
        touchRef.current.lastX = e.touches[0].clientX;
        touchRef.current.lastY = e.touches[0].clientY;
        touchRef.current.startX = zoomPos.x;
        touchRef.current.startY = zoomPos.y;
        touchRef.current.isDragging = true;
        touchRef.current.isPinching = false;
      }
    },
    [zoomScale, zoomPos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchRef.current.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / touchRef.current.lastDist;
        const newScale = Math.max(1, Math.min(5, touchRef.current.startScale * ratio));
        setZoomScale(newScale);
      } else if (touchRef.current.isDragging && e.touches.length === 1 && zoomScale > 1) {
        const dx = e.touches[0].clientX - touchRef.current.lastX;
        const dy = e.touches[0].clientY - touchRef.current.lastY;
        setZoomPos({
          x: touchRef.current.startX + dx,
          y: touchRef.current.startY + dy,
        });
      }
    },
    [zoomScale]
  );

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isPinching = false;
    touchRef.current.isDragging = false;
    if (zoomScale <= 1.05) {
      setZoomScale(1);
      setZoomPos({ x: 0, y: 0 });
    }
  }, [zoomScale]);

  const doubleTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setZoomPos({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
    }
  }, [zoomScale]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      handleDoubleTap();
    }
    doubleTapRef.current = now;
  }, [handleDoubleTap]);

  useEffect(() => {
    if (!zoomOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [zoomOpen, closeZoom]);

  useEffect(() => {
    if (zoomOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [zoomOpen]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/newsletter");
      const data = await res.json();
      setLoggedIn(!!data.loggedIn);
      setMemberNumber(data.memberNumber || "");
      setNewsletters(data.newsletters || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pwNew !== pwConfirm) {
      setPwError("新しいパスワードと確認用パスワードが一致しません");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/member/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setPwSuccess(true);
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setTimeout(() => {
        setPwSuccess(false);
        setShowPwForm(false);
      }, 2000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setMemberNumber("");
    setNewsletters([]);
    setSelectedNl(null);
    fetchData();
  }

  function openReader(nl: NewsletterPreview) {
    if (loggedIn && nl.pages) {
      setSelectedNl(nl);
      setCurrentPage(0);
    }
  }

  function goNext(pages: string[]) {
    setCurrentPage((p: number) => Math.min(pages.length - 1, p + 1));
  }

  function goPrev() {
    setCurrentPage((p: number) => Math.max(0, p - 1));
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pb-6">
        <PageHeader title="ファンクラブ会報" icon="📖" />
        <div className="p-4 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Reader view ──────────────────────────────────────────────
  if (selectedNl && selectedNl.pages) {
    const pages = selectedNl.pages;
    const progress = ((currentPage + 1) / pages.length) * 100;

    return (
      <div className="pb-6 page-enter">
        {/* Sticky header */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-pink-100">
          {/* Row 1: back / title / page counter */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <button
              onClick={() => setSelectedNl(null)}
              className="flex items-center gap-1.5 text-sm text-pink-500 font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              一覧
            </button>
            <div className="text-center">
              <p className="text-sm font-bold leading-tight">{selectedNl.vol}</p>
              <p className="text-xs text-gray-400">{selectedNl.issue}</p>
            </div>
            <span className="text-sm font-mono text-gray-500 tabular-nums">
              {currentPage + 1}<span className="text-gray-300">/{pages.length}</span>
            </span>
          </div>
          {/* Row 2: prev — progress bar — next */}
          <div className="flex items-center gap-2 px-3 pb-2">
            <button
              onClick={goPrev}
              disabled={currentPage === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-pink-200 text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed active:bg-pink-50 flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              前
            </button>
            <div className="flex-1 h-1.5 bg-pink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={() => goNext(pages)}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-pink-400 text-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-pink-500 flex-shrink-0"
            >
              次
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Page image */}
        <div className="relative select-none">
          <div
            className="relative w-full cursor-zoom-in"
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                swipeRef.current.startX = e.touches[0].clientX;
                swipeRef.current.startY = e.touches[0].clientY;
                swipeRef.current.moved = false;
              }
            }}
            onTouchMove={(e) => {
              const dx = Math.abs(e.touches[0].clientX - swipeRef.current.startX);
              const dy = Math.abs(e.touches[0].clientY - swipeRef.current.startY);
              if (dx > 8 || dy > 8) swipeRef.current.moved = true;
            }}
            onTouchEnd={(e) => {
              if (swipeRef.current.moved) {
                const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
                const dy = Math.abs(e.changedTouches[0].clientY - swipeRef.current.startY);
                if (Math.abs(dx) > 50 && dy < 80) {
                  if (dx < 0) goNext(pages);
                  else goPrev();
                }
              }
            }}
            onClick={openZoom}
          >
            <Image
              src={pages[currentPage]}
              alt={`${selectedNl.title} ${currentPage + 1}ページ`}
              width={1200}
              height={850}
              className="w-full h-auto"
              priority
            />
            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              タップで拡大
            </div>
          </div>

        </div>

        {/* Thumbnail strip */}
        <div className="px-4 pb-4 mt-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((page, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === currentPage
                    ? "border-pink-500 opacity-100 scale-105"
                    : "border-transparent opacity-50"
                }`}
              >
                <Image
                  src={page}
                  alt={`${i + 1}ページ`}
                  width={100}
                  height={71}
                  className="w-[72px] h-auto block"
                />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">
            左右スワイプでページを移動
          </p>
        </div>

        {/* Zoom Modal — unchanged from original */}
        {zoomOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={zoomDialogId}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            style={{ touchAction: "none" }}
          >
            <span id={zoomDialogId} className="sr-only">ページ拡大ビューア</span>

            {/* Top bar: close / prev / counter+scale / next */}
            <div className="absolute top-0 left-0 right-0 z-[110] flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
              <button
                ref={closeButtonRef}
                onClick={closeZoom}
                aria-label="閉じる"
                className="bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold active:bg-white/40"
              >
                ✕
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setCurrentPage(Math.max(0, currentPage - 1)); setZoomScale(1); setZoomPos({ x: 0, y: 0 }); }}
                  disabled={currentPage === 0}
                  className="bg-white/20 text-white h-10 px-4 rounded-full flex items-center gap-1.5 text-sm font-bold disabled:opacity-30 active:bg-white/40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  前
                </button>
                <div className="text-center min-w-[48px]">
                  <span className="text-white text-sm font-mono tabular-nums">{currentPage + 1}<span className="text-white/50">/{pages.length}</span></span>
                  {zoomScale > 1.05 && (
                    <p className="text-white/60 text-[10px] leading-none mt-0.5">{Math.round(zoomScale * 100)}%</p>
                  )}
                </div>
                <button
                  onClick={() => { setCurrentPage(Math.min(pages.length - 1, currentPage + 1)); setZoomScale(1); setZoomPos({ x: 0, y: 0 }); }}
                  disabled={currentPage === pages.length - 1}
                  className="bg-white/20 text-white h-10 px-4 rounded-full flex items-center gap-1.5 text-sm font-bold disabled:opacity-30 active:bg-white/40"
                >
                  次
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <div className="w-10" />{/* spacer to balance close button */}
            </div>

            {zoomScale <= 1.05 && (
              <div className="absolute bottom-6 left-0 right-0 text-center z-[110]">
                <span className="text-white/70 text-xs bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                  ピンチで拡大 ・ ダブルタップでズーム
                </span>
              </div>
            )}
            <div
              ref={zoomRef}
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => { if (zoomScale <= 1.05) handleTap(); }}
            >
              <div
                style={{
                  transform: `translate(${zoomPos.x}px, ${zoomPos.y}px) scale(${zoomScale})`,
                  transition: touchRef.current.isPinching || touchRef.current.isDragging ? "none" : "transform 0.3s ease",
                  transformOrigin: "center center",
                }}
                className="px-1"
              >
                <Image
                  src={pages[currentPage]}
                  alt={`${selectedNl.title} ${currentPage + 1}ページ`}
                  width={1200}
                  height={850}
                  className="w-full h-auto max-h-[85vh] object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div className="pb-6 page-enter">
      <PageHeader title="ファンクラブ会報" icon="📖" />

      {loggedIn ? (
        /* ===== Member view ===== */
        <div className="px-4">
          {/* Member bar */}
          <div className="bg-white rounded-2xl px-4 py-3 mb-5 border border-pink-100/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">ログイン中</p>
                <p className="font-bold text-sm text-gray-700">会員番号: {memberNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowPwForm((v: boolean) => !v); setPwError(null); setPwSuccess(false); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500 active:bg-gray-50"
                >
                  パスワード変更
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500 active:bg-gray-50"
                >
                  ログアウト
                </button>
              </div>
            </div>

            {/* Password change form */}
            {showPwForm && (
              <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {pwError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{pwError}</p>
                )}
                {pwSuccess && (
                  <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">パスワードを変更しました</p>
                )}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">現在のパスワード</label>
                  <input
                    type="password"
                    value={pwCurrent}
                    onChange={(e: { target: { value: string } }) => setPwCurrent(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">新しいパスワード（6文字以上）</label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={(e: { target: { value: string } }) => setPwNew(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">新しいパスワード（確認）</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e: { target: { value: string } }) => setPwConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {pwLoading ? "変更中..." : "変更する"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPwForm(false); setPwError(null); }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-pink-500 rounded-full" />
              <h2 className="text-base font-bold">バックナンバー</h2>
            </div>
            <span className="text-xs text-gray-400">{newsletters.length}冊</span>
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-2 gap-3">
            {newsletters.map((nl) => (
              <button
                key={nl.id}
                onClick={() => openReader(nl)}
                className="bg-white rounded-2xl overflow-hidden border border-pink-100/50 text-left active:scale-[0.97] transition-transform shadow-sm"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image
                    src={nl.coverImage}
                    alt={nl.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {nl.pages?.length || nl.totalPages || 0}P
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-pink-400 font-bold">{nl.vol}</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mt-0.5 line-clamp-2">
                    {nl.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{nl.issue}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-300 mt-6">
            今後も会報を更新予定です。お楽しみに！
          </p>
        </div>
      ) : (
        /* ===== Non-member view ===== */
        <div className="px-4 space-y-4">
          {/* Cover preview grid */}
          {newsletters.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {newsletters.map((nl) => (
                <div
                  key={nl.id}
                  className="bg-white rounded-2xl overflow-hidden border border-pink-100/50 shadow-sm"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <Image
                      src={nl.coverImage}
                      alt={nl.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/30 to-transparent flex flex-col items-center justify-end pb-3">
                      <span className="text-lg">🔒</span>
                      <p className="text-[10px] text-gray-500 font-medium">会員限定</p>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-pink-400 font-bold">{nl.vol}</p>
                    <p className="text-[10px] text-gray-400">{nl.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Login CTA */}
          <div className="bg-white rounded-2xl p-5 text-center border border-pink-100/50">
            <p className="text-2xl mb-2">📖</p>
            <h3 className="text-base font-bold mb-1">会員の方はこちら</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              ログインしてバックナンバーを<br />すべてご覧ください。
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-pink-400 text-white font-bold rounded-full text-sm active:bg-pink-500"
            >
              会員ログイン
            </Link>
          </div>

          {/* Membership info */}
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 border border-pink-200/60">
            <h3 className="text-center text-lg font-bold text-pink-600 mb-0.5">
              I♡Rie-Club 入会案内
            </h3>
            <p className="text-center text-xs text-gray-400 mb-4">
              岩波理恵オフィシャルファンクラブ
            </p>

            <div className="bg-white rounded-xl p-4 mb-4 border border-pink-100/50">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">入会金</p>
                  <p className="text-2xl font-bold text-pink-600">¥1,000</p>
                </div>
                <div className="w-px h-10 bg-pink-100" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">年会費</p>
                  <p className="text-2xl font-bold text-pink-600">¥4,000</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="text-pink-400">♡</span> 会員特典
            </h4>
            <ul className="space-y-2 text-sm mb-4">
              {[
                { icon: "🪪", text: "会員証の発行" },
                { icon: "📖", text: "会報のお届け（ブログ未公開写真掲載）" },
                { icon: "🎂", text: "バースデーカード" },
                { icon: "🎍", text: "年賀状（または季節のグリーティングカード）" },
                { icon: "🎫", text: "ライブの割引" },
                { icon: "📺", text: "公開番組の優先ハガキ獲得権" },
                { icon: "🤝", text: "ファンミーティング参加権" },
                { icon: "🎁", text: "更新された方への特典" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-gray-600">{item.text}</span>
                </li>
              ))}
            </ul>

            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100/60">
              <h4 className="text-sm font-bold text-pink-600 mb-2 text-center">
                お申し込み・お問い合わせ
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="text-center font-medium">株式会社トップ・カラー</p>
                <div className="flex items-center justify-center gap-2">
                  <span>📞</span>
                  <a href="tel:03-6272-4581" className="text-pink-600 font-bold">
                    03-6272-4581
                  </a>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✉️</span>
                  <a href="mailto:rie@top-color.jp" className="text-pink-600 font-bold">
                    rie@top-color.jp
                  </a>
                </div>
                <p className="text-center text-xs text-gray-400">受付時間: 平日 11:00〜17:00</p>
                <p className="text-center text-xs text-gray-400 leading-relaxed">
                  メールの場合、3日経っても返信がない場合は<br />お電話にてお問い合わせください。
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <ExternalLink
                href="https://ameblo.jp/rieiwanami/entry-12892373282.html"
                title="入会案内"
                className="inline-block text-xs text-pink-500 underline"
              >
                詳しくはブログの入会案内をご覧ください →
              </ExternalLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
