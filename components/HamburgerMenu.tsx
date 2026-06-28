"use client";

import { useState } from "react";
import Link from "next/link";

const APP_MENU = [
  { href: "/news", label: "ニュース・イベント", icon: "📰" },
  { href: "/blog", label: "個人ブログ", icon: "📝" },
  { href: "/youtube", label: "ミュージックビデオ", icon: "🎬" },
  { href: "/reiwa-channel", label: "Youtube", icon: "▶️" },
  { href: "/live", label: "ライブ配信", icon: "📡" },
  { href: "/agency", label: "事務所情報", icon: "🏢" },
  { href: "/newsletter", label: "ファンクラブ会報", icon: "📖" },
  { href: "/links", label: "リンク集", icon: "🔗" },
  { href: "/about", label: "岩波理恵について", icon: "🎤" },
];

const LINK_CATEGORIES = [
  {
    title: "所属・公式プロフィール",
    links: [
      { label: "アーティストページ（徳間ジャパン）", url: "https://www.tkma.co.jp/enka_top/iwanami.html" },
      { label: "プロフィール（徳間ジャパン）", url: "https://www.tkma.co.jp/enka_profile/iwanami.html" },
      { label: "所属事務所（トップ・カラー）", url: "http://www.top-color.jp/?page_id=5742" },
    ],
  },
  {
    title: "SNS・ライブ配信",
    links: [
      { label: "オフィシャルブログ（Ameba）", url: "https://ameblo.jp/rieiwanami/" },
      { label: "Instagram", url: "https://www.instagram.com/rie_iwanami_rie/" },
      { label: "X（旧Twitter）", url: "https://x.com/Riecocoamateras" },
      { label: "Pococha", url: "https://www.pococha.com/en-us/app/users/56941e2a-71c1-4d91-8fc6-0385ba68ebce" },
      { label: "Wikipedia", url: "https://ja.wikipedia.org/wiki/岩波理恵" },
    ],
  },
  {
    title: "楽曲・動画（YouTube）",
    links: [
      { label: "「薔薇の化身」MV【公式】", url: "https://www.youtube.com/watch?v=j7K2oROq304" },
      { label: "BEST ALBUM『未来への坂道』ダイジェスト", url: "https://www.youtube.com/watch?v=xXCqYh20QA8" },
      { label: "TTCスタジオチャンネル出演動画", url: "https://www.youtube.com/@ttc9397/search?query=%E5%B2%A9%E6%B3%A2" },
      { label: "みんかよ出演動画", url: "https://www.youtube.com/@%E3%81%BF%E3%82%93%E3%81%AA%E3%81%AE%E6%AD%8C%E8%AC%A1%E6%9B%B2%E3%81%BF%E3%82%93%E3%81%8B%E3%82%88/search?query=%E5%B2%A9%E6%B3%A2" },
    ],
  },
  {
    title: "音楽配信・カラオケ",
    links: [
      { label: "Spotify", url: "https://open.spotify.com/intl-ja/artist/3LIUCBE0wZS6YylvX3iumr" },
      { label: "カラオケDAM", url: "https://www.clubdam.com/karaokesearch/artistleaf.html?artistCode=95677" },
    ],
  },
  {
    title: "メディア・出演関連",
    links: [
      { label: "みんかよ 公式サイト", url: "https://minkayo.amebaownd.com" },
      { label: "ORICON NEWS", url: "https://www.oricon.co.jp/prof/500324/" },
    ],
  },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="flex flex-col gap-1 p-1"
      >
        <span className="block w-5 h-0.5 bg-white rounded" />
        <span className="block w-5 h-0.5 bg-white rounded" />
        <span className="block w-5 h-0.5 bg-white rounded" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col overflow-hidden">
            <div className="header-gradient px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <span className="text-white font-semibold text-sm">メニュー</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="閉じる" className="text-white text-2xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 pb-8">
              {/* アプリ内メニュー */}
              <div className="px-3 pt-2 pb-1">
                <p className="text-[0.6rem] font-bold text-gray-400 tracking-wider mb-1 px-1">アプリ内</p>
                {APP_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-pink-50 active:bg-pink-100 transition-colors"
                  >
                    <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-100 mx-3 my-1" />

              {/* 外部リンク */}
              {LINK_CATEGORIES.map((cat) => (
                <div key={cat.title} className="px-3 py-1">
                  <p className="text-[0.6rem] font-bold text-gray-400 tracking-wider mb-1 px-1">{cat.title}</p>
                  {cat.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-pink-50 active:bg-pink-100 transition-colors"
                    >
                      <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-xs text-gray-600 leading-snug">{link.label}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
