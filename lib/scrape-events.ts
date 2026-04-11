import * as cheerio from "cheerio";
import { EventItem } from "./types";

const EVENTS_URL = "https://top-color.jp/?cat=121";

export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(EVENTS_URL, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items: EventItem[] = [];

    // Posts are rendered as <h4><a href="...">title</a></h4>
    $("h4 a").each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr("href");
      if (title && href) {
        const url = href.startsWith("http")
          ? href
          : `https://top-color.jp${href}`;
        items.push({ title, url });
      }
    });

    // Fallback: try h2/h3 links if h4 found nothing
    if (items.length === 0) {
      $("h2 a, h3 a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");
        if (title && href && href.includes("top-color.jp")) {
          items.push({ title, url: href });
        }
      });
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}
