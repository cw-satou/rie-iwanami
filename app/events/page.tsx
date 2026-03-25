import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

// Events data - in production, fetch from CMS or API
const events = [
  {
    month: "2月",
    day: "11",
    weekday: "火・祝",
    name: "岩波理恵 バレンタインスペシャルライブ",
    venue: "東京・日本橋三越本店 特設ステージ",
    time: "①13:00〜 ②15:00〜",
    note: "観覧無料・握手会あり",
  },
  {
    month: "2月",
    day: "23",
    weekday: "日",
    name: "「未来への坂道」発売記念サイン会",
    venue: "大阪・なんばパークス 1F イベントスペース",
    time: "14:00〜（先着100名様）",
    note: "CDご購入の方対象",
  },
  {
    month: "3月",
    day: "8",
    weekday: "土",
    name: "岩波理恵 スプリングコンサート2026",
    venue: "名古屋・中日劇場",
    time: "開場 14:30 / 開演 15:00",
    note: "全席指定 ¥6,500",
  },
  {
    month: "3月",
    day: "21",
    weekday: "金・祝",
    name: "NHK「歌謡プレミアム」公開収録",
    venue: "NHKホール",
    time: "開場 17:00 / 開演 18:00",
    note: "観覧ハガキ応募制",
  },
  {
    month: "4月",
    day: "5",
    weekday: "土",
    name: "春のファンクラブ会員限定イベント",
    venue: "東京都内（詳細は会報にて）",
    time: "未定",
    note: "FC会員限定・要事前申込",
  },
];

export default function EventsPage() {
  return (
    <div className="pb-20 page-enter">
      <PageHeader title="イベント情報" icon="📅" />

      <div className="p-4 space-y-3">
        {events.map((event, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 flex gap-4 border border-pink-100/50"
          >
            {/* Date box */}
            <div className="flex-shrink-0 w-16 text-center">
              <div className="bg-red-500 text-white text-[0.65rem] font-bold rounded-t-lg py-0.5">
                {event.month}
              </div>
              <div className="bg-white border border-gray-100 rounded-b-lg py-1">
                <div className="text-2xl font-bold text-gray-800 leading-tight">
                  {event.day}
                </div>
                <div className="text-[0.6rem] text-gray-400">
                  {event.weekday}
                </div>
              </div>
            </div>

            {/* Event info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1 leading-snug">
                {event.name}
              </h3>
              <div className="space-y-0.5 text-xs text-gray-500">
                <p>📍 {event.venue}</p>
                <p>🕐 {event.time}</p>
                <p className="text-pink-500 font-medium mt-1">
                  ※ {event.note}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
