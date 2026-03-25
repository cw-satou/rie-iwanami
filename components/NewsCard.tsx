import ExternalLink from "@/components/ExternalLink";
import { NewsItem } from "@/lib/types";

const tagClassMap: Record<string, string> = {
  MEDIA: "tag-media",
  EVENT: "tag-event",
  RELEASE: "tag-release",
  OTHER: "tag-other",
};

const iconMap: Record<string, string> = {
  MEDIA: "📺",
  EVENT: "🎤",
  RELEASE: "💿",
  OTHER: "🎬",
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const content = (
    <>
      <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-2xl flex-shrink-0">
        {iconMap[item.tag] || "📰"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">{item.date}</span>
          <span className={`tag ${tagClassMap[item.tag] || "tag-other"}`}>
            {item.tag}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {item.title}
        </p>
      </div>
    </>
  );

  const className =
    "flex items-start gap-3 p-4 bg-white rounded-2xl card-hover border border-pink-100/50";

  if (item.url) {
    return (
      <ExternalLink
        href={item.url}
        title={item.title}
        className={className}
      >
        {content}
      </ExternalLink>
    );
  }

  return <div className={className}>{content}</div>;
}
