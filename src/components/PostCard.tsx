import Link from "next/link";
import type { Post } from "@/lib/supabase";

export default function PostCard({ post }: { post: Post }) {
  const date = new Date(post.published_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block p-6 -mx-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
        <time className="text-sm text-gray-500 dark:text-gray-400">{date}</time>
        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {post.title}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
          {post.excerpt}
        </p>
        <span className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
          阅读更多 →
        </span>
      </Link>
    </article>
  );
}
