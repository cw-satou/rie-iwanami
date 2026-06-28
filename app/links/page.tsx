import PageHeader from "@/components/PageHeader";

const LINK_CATEGORIES = [
  {
    title: "所属・公式プロフィール",
    icon: "🏢",
    links: [
      { label: "岩波理恵 アーティストページ（徳間ジャパン公式）", url: "https://www.tkma.co.jp/enka_top/iwanami.html" },
      { label: "岩波理恵 プロフィール（徳間ジャパン）", url: "https://www.tkma.co.jp/enka_profile/iwanami.html" },
      { label: "岩波理恵 所属事務所ページ（トップ・カラー）", url: "http://www.top-color.jp/?page_id=5742" },
    ],
  },
  {
    title: "SNS・ライブ配信",
    icon: "💬",
    links: [
      { label: "岩波理恵 オフィシャルブログ（Ameba）", url: "https://ameblo.jp/rieiwanami/" },
      { label: "【公式】岩波理恵 Instagram", url: "https://www.instagram.com/rie_iwanami_rie/" },
      { label: "岩波理恵 X（旧Twitter）", url: "https://x.com/Riecocoamateras" },
      { label: "岩波理恵 Pococha プロフィール", url: "https://www.pococha.com/en-us/app/users/56941e2a-71c1-4d91-8fc6-0385ba68ebce" },
      { label: "岩波理恵 Wikipedia", url: "https://ja.wikipedia.org/wiki/岩波理恵" },
    ],
  },
  {
    title: "楽曲・動画（YouTube）",
    icon: "🎬",
    links: [
      { label: "「薔薇の化身」MV【公式】", url: "https://www.youtube.com/watch?v=j7K2oROq304" },
      { label: "BEST ALBUM『未来への坂道』ダイジェスト", url: "https://www.youtube.com/watch?v=xXCqYh20QA8" },
      { label: "TTCスタジオチャンネル（岩波理恵出演動画）", url: "https://www.youtube.com/@ttc9397/search?query=%E5%B2%A9%E6%B3%A2" },
      { label: "みんなの歌謡曲（みんかよ）出演動画", url: "https://www.youtube.com/@%E3%81%BF%E3%82%93%E3%81%AA%E3%81%AE%E6%AD%8C%E8%AC%A1%E6%9B%B2%E3%81%BF%E3%82%93%E3%81%8B%E3%82%88/search?query=%E5%B2%A9%E6%B3%A2" },
    ],
  },
  {
    title: "音楽配信・カラオケ",
    icon: "🎵",
    links: [
      { label: "岩波理恵 Spotify アーティストページ", url: "https://open.spotify.com/intl-ja/artist/3LIUCBE0wZS6YylvX3iumr" },
      { label: "岩波理恵 カラオケDAM 検索ページ", url: "https://www.clubdam.com/karaokesearch/artistleaf.html?artistCode=95677" },
    ],
  },
  {
    title: "メディア・出演関連",
    icon: "📰",
    links: [
      { label: "みんなの歌謡曲（みんかよ）公式サイト", url: "https://minkayo.amebaownd.com" },
      { label: "岩波理恵 ORICON NEWS プロフィール", url: "https://www.oricon.co.jp/prof/500324/" },
    ],
  },
];

export default function LinksPage() {
  return (
    <div className="pb-8 page-enter">
      <PageHeader title="リンク集" icon="🔗" />

      <div className="px-4 space-y-5 mt-2">
        {LINK_CATEGORIES.map((cat) => (
          <section key={cat.title}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cat.icon}</span>
              <h2 className="text-xs font-bold text-gray-500 tracking-wide">{cat.title}</h2>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100/50 divide-y divide-gray-50">
              {cat.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50 active:bg-pink-100 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span className="flex-1 text-sm font-medium text-gray-700 leading-snug">{link.label}</span>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
