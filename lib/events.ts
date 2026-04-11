export interface EventItem {
  id: string;
  month: string;
  day: string;
  weekday: string;
  name: string;
  venue: string;
  time: string;
  note: string;
  description?: string;
  url?: string; // 外部サイトURL（未設定の場合は事務所イベントページへ）
}

// Events data - sorted newest first. In production, fetch from CMS or API
export const events: EventItem[] = [
  {
    id: "2026-04-05-fc-event",
    month: "4月",
    day: "5",
    weekday: "土",
    name: "春のファンクラブ会員限定イベント",
    venue: "東京都内（詳細は会報にて）",
    time: "未定",
    note: "FC会員限定・要事前申込",
    description:
      "I♡Rie-Club会員の皆様だけの特別イベントです。詳しい場所やスケジュールは会報にてご案内いたします。会員の方は事前のお申し込みをお忘れなく！",
  },
  {
    id: "2026-03-21-nhk",
    month: "3月",
    day: "21",
    weekday: "金・祝",
    name: "NHK「歌謡プレミアム」公開収録",
    venue: "NHKホール",
    time: "開場 17:00 / 開演 18:00",
    note: "観覧ハガキ応募制",
    description:
      "NHK総合の音楽番組「歌謡プレミアム」の公開収録に出演いたします。観覧ご希望の方はハガキでのご応募が必要です。詳しくはNHK公式サイトをご確認ください。",
  },
  {
    id: "2026-03-08-spring-concert",
    month: "3月",
    day: "8",
    weekday: "土",
    name: "岩波理恵 スプリングコンサート2026",
    venue: "名古屋・中日劇場",
    time: "開場 14:30 / 開演 15:00",
    note: "全席指定 ¥6,500",
    description:
      "春の名古屋公演です。「薔薇の化身」をはじめ、最新曲から懐かしの名曲まで、たっぷりとお届けします。全席指定¥6,500。お早めにお求めください。",
  },
  {
    id: "2026-02-23-sign-event",
    month: "2月",
    day: "23",
    weekday: "日",
    name: "「未来への坂道」発売記念サイン会",
    venue: "大阪・なんばパークス 1F イベントスペース",
    time: "14:00〜（先着100名様）",
    note: "CDご購入の方対象",
    description:
      "ニューシングル「未来への坂道」の発売を記念したサイン会を開催。CDをご購入いただいた方が対象です。先着100名様限定ですので、お早めにお越しください。",
  },
  {
    id: "2026-02-11-valentine-live",
    month: "2月",
    day: "11",
    weekday: "火・祝",
    name: "岩波理恵 バレンタインスペシャルライブ",
    venue: "東京・日本橋三越本店 特設ステージ",
    time: "①13:00〜 ②15:00〜",
    note: "観覧無料・握手会あり",
    description:
      "バレンタインの特別ライブ！日本橋三越本店の特設ステージにて、1日2回公演。観覧無料で、ライブ後の握手会もございます。お気軽にお越しください。",
  },
];

export function getEventById(id: string): EventItem | undefined {
  return events.find((e) => e.id === id);
}
