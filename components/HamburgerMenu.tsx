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
];

const LINK_CATEGORIES = [
  {
    title: "本人発信（SNS・配信）",
    links: [
      { label: "岩波理恵 オフィシャルブログ（Ameba）", url: "https://ameblo.jp/rieiwanami/" },
      { label: "【公式】岩波理恵 Instagram", url: "https://www.instagram.com/rie_iwanami_rie/" },
      { label: "岩波理恵 X（旧Twitter）", url: "https://x.com/Riecocoamateras" },
      { label: "岩波理恵 Pococha プロフィール", url: "https://www.pococha.com/en-us/app/users/56941e2a-71c1-4d91-8fc6-0385ba68ebce" },
    ],
  },
  {
    title: "楽曲・動画（YouTube）",
    links: [
      { label: "「薔薇の化身」MV【公式】", url: "https://www.youtube.com/watch?v=j7K2oROq304" },
      { label: "BEST ALBUM『未来への坂道』ダイジェスト", url: "https://www.youtube.com/watch?v=xXCqYh20QA8" },
      { label: "TTCスタジオチャンネル（ライブ動画・バラエティー）", url: "https://www.youtube.com/channel/UCE11WO9Eo28T00yeaP-fHJA" },
      { label: "みんなの歌謡曲（みんかよ）YouTubeチャンネル", url: "https://www.youtube.com/channel/UCxajMhVhlevnwlN0mn3sG1g" },
    ],
  },
  {
    title: "音楽配信・カラオケ",
    links: [
      { label: "岩波理恵 Spotify アーティストページ", url: "https://open.spotify.com/intl-ja/artist/3LIUCBE0wZS6YylvX3iumr" },
      { label: "岩波理恵 カラオケDAM 検索ページ", url: "https://www.clubdam.com/karaokesearch/artistleaf.html?artistCode=95677" },
    ],
  },
  {
    title: "所属・公式プロフィール",
    links: [
      { label: "岩波理恵 アーティストページ（徳間ジャパン公式）", url: "https://www.tkma.co.jp/enka_top/iwanami.html" },
      { label: "岩波理恵 プロフィール（徳間ジャパン）", url: "https://www.tkma.co.jp/enka_profile/iwanami.html" },
      { label: "岩波理恵 所属事務所ページ（トップ・カラー）", url: "http://www.top-color.jp/?page_id=5742" },
    ],
  },
  {
    title: "メディア・出演関連",
    links: [
      { label: "みんなの歌謡曲（みんかよ）公式サイト", url: "https://minkayo.amebaownd.com" },
      { label: "岩波理恵 Wikipedia", url: "https://ja.wikipedia.org/wiki/岩波理恵" },
      { label: "岩波理恵 ORICON NEWS プロフィール", url: "https://www.oricon.co.jp/prof/500324/" },
    ],
  },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
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
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* ドロワー（右から） */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col overflow-hidden">
            {/* ヘッダー */}
            <div className="header-gradient px-4 py-3 flex items-center justify-between flex-shrink-0">
              <span className="text-white font-semibold text-sm">メニュー</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pb-8">
              {/* アプリ内メニュー */}
              <div className="px-4 py-3">
                <p className="text-[0.65rem] font-bold text-gray-400 tracking-wider mb-2">アプリ内</p>
                <div className="space-y-1">
                  {APP_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-pink-50 active:bg-pink-100 transition-colors"
                    >
                      <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 mx-4" />

              {/* 外部リンク */}
              {LINK_CATEGORIES.map((cat) => (
                <div key={cat.title} className="px-4 py-3">
                  <p className="text-[0.65rem] font-bold text-gray-400 tracking-wider mb-2">{cat.title}</p>
                  <div className="space-y-1">
                    {cat.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-pink-50 active:bg-pink-100 transition-colors"
                      >
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-xs text-gray-600 leading-snug">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
