import * as cheerio from "cheerio";
import { EventItem } from "./types";

const EVENTS_URL = "https://top-color.jp/?cat=121";

/** 記事本文から最初のイベント日付・時間を抽出 */
function extractEventDate(html: string): string | undefined {
  const $ = cheerio.load(html);
  // メインコンテンツ部分に絞る（サイドバーの月別アーカイブを除外）
  const contentText =
    $(".entry-content, .post-content, article, .content, main").first().text() ||
    $("body").text();

  // 日付パターン: "4月2日（木）" "2026年4月2日" など
  const dateMatch = contentText.match(
    /(\d{4}年)?(\d{1,2})月(\d{1,2})日[（(]?[月火水木金土日]?[)）]?/
  );
  if (!dateMatch) return undefined;

  const dateStr = dateMatch[0];

  // 日付から300文字以内の時刻パターン: "15:00" "15：00" "開場12:00" など
  const afterDate = contentText.slice(contentText.indexOf(dateStr));
  const timeMatch = afterDate.slice(0, 300).match(/(\d{1,2})[：:]\d{2}/);

  return timeMatch ? `${dateStr} ${timeMatch[0]}〜` : dateStr;
}

export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(EVENTS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const rawItems: { title: string; url: string }[] = [];

    $("h4 a").each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr("href");
      if (title && href) {
        const url = href.startsWith("http") ? href : `https://top-color.jp${href}`;
        rawItems.push({ title, url });
      }
    });

    // フォールバック
    if (rawItems.length === 0) {
      $("h2 a, h3 a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");
        if (title && href && href.includes("top-color.jp")) {
          rawItems.push({ title, url: href });
        }
      });
    }

    // 各記事ページから日付を並列取得
    const items = await Promise.all(
      rawItems.map(async (item) => {
        try {
          const pageRes = await fetch(item.url, { next: { revalidate: 86400 } });
          if (!pageRes.ok) return { ...item };
          const pageHtml = await pageRes.text();
          const date = extractEventDate(pageHtml);
          return { ...item, date };
        } catch {
          return { ...item };
        }
      })
    );

    return items;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}
