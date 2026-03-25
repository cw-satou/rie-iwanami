import * as cheerio from "cheerio";
import { BlogPost } from "./types";

const BLOG_URL = "https://ameblo.jp/rieiwanami/";
const BLOG_RSS = "https://rssblog.ameba.jp/rieiwanami/rss20.xml";

export async function fetchBlog(): Promise<BlogPost[]> {
  // Try RSS first
  try {
    const res = await fetch(BLOG_RSS, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FanClubApp/1.0)",
      },
    });
    if (res.ok) {
      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const posts: BlogPost[] = [];

      $("item").each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find("title").text().trim();
        const link = $(el).find("link").text().trim();
        const pubDate = $(el).find("pubDate").text().trim();
        const description = $(el).find("description").text().trim();

        // Extract thumbnail from description HTML
        const descHtml = cheerio.load(description);
        const thumb = descHtml("img").first().attr("src") || "";

        // Clean description text
        const excerpt = descHtml.text().substring(0, 120) + "...";

        if (title) {
          posts.push({
            date: formatDate(pubDate),
            title,
            excerpt,
            url: link,
            thumbnail: thumb || undefined,
          });
        }
      });

      if (posts.length > 0) return posts;
    }
  } catch (e) {
    console.error("RSS fetch failed, trying HTML:", e);
  }

  // Fallback: scrape HTML
  try {
    const res = await fetch(BLOG_URL, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const posts: BlogPost[] = [];

    $("article, .skin-entryBody, [data-uranus-component='entryList'] > div")
      .slice(0, 10)
      .each((_, el) => {
        const title = $(el).find("h2, .skin-entryTitle, .entry-title").text().trim();
        const link =
          $(el).find("a[href*='entry-']").first().attr("href") ||
          $(el).find("a").first().attr("href") ||
          "";
        const dateEl = $(el).find("time, .date, .skin-entryDate").text().trim();
        const excerpt = $(el)
          .find(".skin-entryBody, .entry-content, p")
          .first()
          .text()
          .substring(0, 120) + "...";
        const thumb =
          $(el).find("img").first().attr("src") || undefined;

        if (title) {
          posts.push({
            date: dateEl,
            title,
            excerpt,
            url: link.startsWith("http") ? link : `https://ameblo.jp${link}`,
            thumbnail: thumb,
          });
        }
      });

    return posts;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    return [];
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}
