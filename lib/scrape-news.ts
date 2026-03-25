import * as cheerio from "cheerio";
import { NewsItem } from "./types";

const NEWS_URL = "https://www.tkma.co.jp/enka_news/iwanami.html";

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(NEWS_URL, {
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const items: NewsItem[] = [];

    // Parse news items from the topics list
    $(".topics_list li, .news_list li, .list_topics li").each((_, el) => {
      const dateText = $(el).find(".date, .news_date, time").text().trim();
      const tag =
        $(el).find(".cate, .tag, .label, .category").first().text().trim() ||
        "OTHER";
      const title = $(el)
        .find(".title, .ttl, a, .news_ttl, .txt")
        .first()
        .text()
        .trim();
      const link = $(el).find("a").attr("href");
      const url = link
        ? link.startsWith("http")
          ? link
          : `https://www.tkma.co.jp${link}`
        : undefined;

      if (title) {
        items.push({
          date: dateText || "",
          tag: tag.toUpperCase(),
          title,
          url,
        });
      }
    });

    // Fallback: parse by text patterns if structured selectors didn't work
    if (items.length === 0) {
      const text = html;
      const datePattern =
        /(\d{4}年\d{2}月\d{2}日)\s*(MEDIA|EVENT|RELEASE|OTHER)\s*\n\s*([^\n]+)/g;
      let match;
      while ((match = datePattern.exec(text)) !== null) {
        items.push({
          date: match[1],
          tag: match[2],
          title: match[3].trim(),
        });
      }
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}
