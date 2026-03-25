"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

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

  // Loading state
  if (loading) {
    return (
      <div className="pb-[80px]">
        <PageHeader title="ファンクラブ会報" icon="📖" />
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  // Full-page reader view (members only)
  if (selectedNl && selectedNl.pages) {
    const pages = selectedNl.pages;
    return (
      <div className="pb-[80px] page-enter">
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-pink-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSelectedNl(null)}
              className="flex items-center gap-1 text-sm text-pink-500 font-medium"
            >
              ← 戻る
            </button>
            <span className="text-sm font-bold">
              {selectedNl.title}
            </span>
            <span className="text-xs text-gray-400">
              {currentPage + 1}/{pages.length}
            </span>
          </div>
        </div>

        {/* Page image */}
        <div className="px-2 py-3">
          <div className="relative w-full">
            <Image
              src={pages[currentPage]}
              alt={`${selectedNl.title} - ${currentPage + 1}ページ`}
              width={1200}
              height={850}
              className="w-full h-auto rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-center gap-4 px-4 pb-4">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex-1 max-w-[140px] py-2.5 rounded-full text-sm font-bold border border-pink-200 text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed active:bg-pink-50"
          >
            ← 前のページ
          </button>
          <div className="flex gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentPage ? "bg-pink-500" : "bg-pink-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() =>
              setCurrentPage(Math.min(pages.length - 1, currentPage + 1))
            }
            disabled={currentPage === pages.length - 1}
            className="flex-1 max-w-[140px] py-2.5 rounded-full text-sm font-bold bg-pink-400 text-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-pink-500"
          >
            次のページ →
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="px-4 pb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pages.map((page, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === currentPage
                    ? "border-pink-500"
                    : "border-transparent opacity-60"
                }`}
              >
                <Image
                  src={page}
                  alt={`${i + 1}ページ`}
                  width={100}
                  height={71}
                  className="w-[80px] h-auto"
                />
              </button>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Main newsletter list view
  return (
    <div className="pb-[80px] page-enter">
      <PageHeader title="ファンクラブ会報" icon="📖" />

      {loggedIn ? (
        /* ===== Logged in: Member view ===== */
        <div className="p-4">
          {/* Member bar */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between mb-4 border border-pink-100/50">
            <div>
              <p className="font-bold text-sm">会員番号: {memberNumber}</p>
              <p className="text-xs text-gray-400">
                ようこそ！会報をお楽しみください
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500 active:bg-gray-50"
            >
              ログアウト
            </button>
          </div>

          {/* Section header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-pink-500 rounded-full" />
            <h2 className="text-base font-bold">会報バックナンバー</h2>
          </div>

          {/* Newsletter cards (member: clickable, full access) */}
          <div className="space-y-4">
            {newsletters.map((nl) => (
              <button
                key={nl.id}
                onClick={() => openReader(nl)}
                className="w-full bg-white rounded-2xl overflow-hidden border border-pink-100/50 text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative">
                  <Image
                    src={nl.coverImage}
                    alt={nl.title}
                    width={600}
                    height={425}
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-bold text-base drop-shadow">
                      {nl.title}
                    </p>
                    <p className="text-white/80 text-xs mt-0.5">
                      {nl.issue} ・ {nl.pages?.length || 0}ページ
                    </p>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm text-pink-500 font-medium">
                    📖 タップして読む
                  </span>
                  <span className="text-xs text-gray-400">
                    {nl.pages?.length || 0}ページ
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            今後も会報を更新予定です。お楽しみに！
          </p>
        </div>
      ) : (
        /* ===== Not logged in: Cover preview + Membership info ===== */
        <div className="p-4 space-y-4">
          {/* Cover preview */}
          {newsletters.map((nl) => (
            <div
              key={nl.id}
              className="bg-white rounded-2xl overflow-hidden border border-pink-100/50"
            >
              <div className="relative">
                <Image
                  src={nl.coverImage}
                  alt={nl.title}
                  width={600}
                  height={425}
                  className="w-full h-auto"
                />
                {/* Blurred overlay on bottom half to tease */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      🔒 続きは会員限定
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      全{nl.totalPages}ページ
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 text-center">
                <p className="font-bold text-sm">{nl.title}</p>
                <p className="text-xs text-gray-400">{nl.issue}</p>
              </div>
            </div>
          ))}

          {/* Login CTA */}
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100/50">
            <h3 className="text-lg font-bold mb-2">📖 会員の方はこちら</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              ログインしてバックナンバーを
              <br />
              すべてご覧ください。
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-pink-400 text-white font-bold rounded-full text-sm active:bg-pink-500"
            >
              会員ログイン
            </Link>
          </div>

          {/* ===== 入会案内セクション ===== */}
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 border border-pink-200/60">
            <h3 className="text-center text-lg font-bold text-pink-600 mb-1">
              I♡Rie-Club 入会案内
            </h3>
            <p className="text-center text-xs text-gray-400 mb-4">
              岩波理恵オフィシャルファンクラブ
            </p>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-4 mb-4 border border-pink-100/50">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">入会金</p>
                  <p className="text-2xl font-bold text-pink-600">
                    ¥1,000
                  </p>
                </div>
                <div className="w-px h-10 bg-pink-100" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">年会費</p>
                  <p className="text-2xl font-bold text-pink-600">
                    ¥4,000
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
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

            {/* Contact info */}
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100/60">
              <h4 className="text-sm font-bold text-pink-600 mb-2 text-center">
                お申し込み・お問い合わせ
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="text-center font-medium">
                  株式会社トップ・カラー
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span>📞</span>
                  <a href="tel:03-6272-4581" className="text-pink-600 font-bold">
                    03-6272-4581
                  </a>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✉️</span>
                  <a
                    href="mailto:rie@top-color.jp"
                    className="text-pink-600 font-bold"
                  >
                    rie@top-color.jp
                  </a>
                </div>
                <p className="text-center text-xs text-gray-400">
                  受付時間: 平日 11:00〜17:00
                </p>
                <p className="text-center text-xs text-gray-400 leading-relaxed">
                  メールの場合、3日経っても返信がない場合は
                  <br />
                  お電話にてお問い合わせください。
                </p>
              </div>
            </div>

            {/* Blog link */}
            <div className="mt-4 text-center">
              <a
                href="https://ameblo.jp/rieiwanami/entry-12892373282.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-pink-500 underline"
              >
                詳しくはブログの入会案内をご覧ください →
              </a>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
