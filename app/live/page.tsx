import PageHeader from "@/components/PageHeader";

export default function LivePage() {
  return (
    <div className="pb-6 page-enter">
      <PageHeader title="ライブ配信" icon="📡" />

      <div className="p-4 space-y-4">
        {/* Pococha profile */}
        <a
          href="https://www.pococha.com/ja-jp/app/users/56941e2a-71c1-4d91-8fc6-0385ba68ebce"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
        >
          <div className="h-2 bg-gradient-to-r from-pink-400 to-rose-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center text-2xl flex-shrink-0">
                📡
              </span>
              <div>
                <p className="text-[0.65rem] text-pink-500 font-semibold tracking-wider uppercase">Pococha</p>
                <h2 className="font-bold text-sm leading-snug">岩波理恵 プロフィール</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pocochaで岩波理恵のライブ配信を視聴できます。プロフィールページへアクセスしてフォローしてください。
            </p>
            <span className="text-xs text-pink-500 font-medium mt-3 inline-block">
              Pocochaで見る →
            </span>
          </div>
        </a>

        {/* Interview article */}
        <a
          href="https://report.pococha.com/n/ne89cb98c4d1e"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
        >
          <div className="h-2 bg-gradient-to-r from-purple-400 to-pink-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
                📰
              </span>
              <div>
                <p className="text-[0.65rem] text-purple-500 font-semibold tracking-wider uppercase">Interview</p>
                <h2 className="font-bold text-sm leading-snug">インタビュー記事</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pococha公式レポートによる岩波理恵のインタビュー記事をご覧いただけます。
            </p>
            <span className="text-xs text-purple-500 font-medium mt-3 inline-block">
              記事を読む →
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
