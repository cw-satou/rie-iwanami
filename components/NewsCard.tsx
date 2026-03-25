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
      <div className="w-[48px] h-[48px] rounded-xl bg-pink-50 flex items-center justify-center text-[24px] flex-shrink-0">
        {iconMap[item.tag] || "📰"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[8px] mb-[4px]">
          <span className="text-[12px] text-gray-400">{item.date}</span>
          <span className={`tag ${tagClassMap[item.tag] || "tag-other"}`}>
            {item.tag}
          </span>
        </div>
        <p className="text-[14px] font-medium leading-snug line-clamp-2">
          {item.title}
        </p>
      </div>
    </>
  );

  const className =
    "flex items-start gap-[12px] p-[16px] bg-white rounded-2xl card-hover border border-pink-100/50";

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
