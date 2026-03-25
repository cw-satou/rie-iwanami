import PageHeader from "@/components/PageHeader";
import ExternalLink from "@/components/ExternalLink";
import { fetchBlog } from "@/lib/scrape-blog";

export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await fetchBlog();

  return (
    <div className="pb-6 page-enter">
      <PageHeader title="個人ブログ" icon="📝" />

      <div className="p-4 space-y-3">
        {posts.length > 0 ? (
          posts.map((post, i) => (
            <ExternalLink
              key={i}
              href={post.url}
              title={post.title}
              className="block bg-white rounded-2xl overflow-hidden card-hover border border-pink-100/50"
            >
              {post.thumbnail && (
                <div className="aspect-[2/1] bg-gray-100 overflow-hidden">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{post.date}</p>
                <h3 className="font-bold text-sm mb-2 leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <span className="text-xs text-pink-500 font-medium mt-2 inline-block">
                  続きを読む →
                </span>
              </div>
            </ExternalLink>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              ブログを取得できませんでした
            </p>
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <ExternalLink
          href="https://ameblo.jp/rieiwanami/"
          title="個人ブログ"
          className="text-sm text-pink-500 font-medium"
        >
          アメブロで見る →
        </ExternalLink>
      </div>

    </div>
  );
}
