import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";

const agencyLinks = [
  {
    icon: "👤",
    title: "岩波理恵 プロフィール",
    description: "プロフィール・略歴・ディスコグラフィ",
    url: "https://www.top-color.jp/?page_id=5742",
  },
  {
    icon: "🎤",
    title: "ライブ・イベント情報",
    description: "トップ・カラー所属タレントのライブ情報",
    url: "https://www.top-color.jp/?cat=4",
  },
];

export default function AgencyPage() {
  return (
    <div className="pb-6 page-enter">
      <PageHeader title="事務所情報" icon="🏢" />

      <div className="p-4 space-y-4">
        {/* Agency info card */}
        <div className="bg-white rounded-2xl p-5 border border-pink-100/50 text-center">
          <p className="text-2xl mb-2">🏢</p>
          <h2 className="text-base font-bold">株式会社トップ・カラー</h2>
          <p className="text-xs text-gray-400 mt-1">
            芸能プロダクション
          </p>
          <div className="mt-3 pt-3 border-t border-pink-50 text-xs text-gray-500 space-y-1">
            <p>東京都港区麻布十番2-3-5</p>
            <p>新麻布十番ビルディング4階</p>
            <p className="mt-2">
              📞{" "}
              <a href="tel:03-6272-4581" className="text-pink-600 font-bold">
                03-6272-4581
              </a>
            </p>
            <p className="text-gray-400">平日 11:00〜17:00</p>
          </div>
        </div>

        {/* Links to agency pages */}
        <div className="space-y-3">
          {agencyLinks.map((link) => (
            <ExternalLink
              key={link.url}
              href={link.url}
              title={link.title}
              className="block bg-white rounded-2xl p-4 border border-pink-100/50 active:bg-pink-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="flex-shrink-0 w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-2xl">
                  {link.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {link.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </div>
            </ExternalLink>
          ))}
        </div>

        {/* Official site button */}
        <div className="text-center pt-2">
          <ExternalLink
            href="https://www.top-color.jp/"
            title="トップ・カラー公式サイト"
            className="inline-block px-8 py-3 bg-pink-400 text-white font-bold rounded-full text-sm active:bg-pink-500"
          >
            トップ・カラー公式サイト →
          </ExternalLink>
        </div>
      </div>

    </div>
  );
}
