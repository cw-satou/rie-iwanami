import { notFound } from "next/navigation";
import Link from "next/link";
import { events, getEventById } from "@/lib/events";

export function generateStaticParams() {
  return events.map((e) => ({ id: e.id }));
}

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = getEventById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="pb-6 page-enter">
      {/* Header */}
      <div className="header-gradient px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/news"
            className="text-white/90 text-sm font-medium flex items-center gap-1"
          >
            ← 戻る
          </Link>
          <span className="text-white/70 text-xs">イベント詳細</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Date & Title */}
        <div className="bg-white rounded-2xl overflow-hidden border border-pink-100/50">
          {/* Date bar */}
          <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-3">
            <span className="text-2xl font-bold">{event.month}{event.day}日</span>
            <span className="text-sm opacity-90">（{event.weekday}）</span>
          </div>

          <div className="p-5">
            <h1 className="text-lg font-bold leading-snug mb-4">
              {event.name}
            </h1>

            {/* Info grid */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center text-base">
                  📍
                </span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">会場</p>
                  <p className="text-sm font-medium">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center text-base">
                  🕐
                </span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">時間</p>
                  <p className="text-sm font-medium">{event.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center text-base">
                  💡
                </span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">備考</p>
                  <p className="text-sm font-medium text-pink-600">
                    {event.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-white rounded-2xl p-5 border border-pink-100/50">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
              <span className="text-pink-400">♡</span> 詳細
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Contact/Agency link */}
        <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-100/50">
          <p className="text-xs text-gray-500 mb-2">
            お問い合わせはこちら
          </p>
          <a
            href="https://www.top-color.jp/?cat=4"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-pink-400 text-white font-bold rounded-full text-sm active:bg-pink-500"
          >
            事務所ライブ情報 →
          </a>
        </div>

        {/* Back to list */}
        <div className="text-center pt-2">
          <Link
            href="/news"
            className="text-sm text-pink-500 font-medium"
          >
            ← ニュース/イベント一覧に戻る
          </Link>
        </div>
      </div>

    </div>
  );
}
