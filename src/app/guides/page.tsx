import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "攻略文章 - HearthGuide",
  description: "炉石传说上分攻略、版本解析和新手教程",
};

export default async function GuidesPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">攻略文章</h1>
      <p className="text-gray-500 mb-8">共 {posts.length} 篇攻略</p>

      <div className="space-y-4">
        {posts.map((post) => {
          const date = new Date(post.published_at).toLocaleDateString("zh-CN", {
            year: "numeric", month: "long", day: "numeric",
          });
          return (
            <Link
              key={post.id}
              href={`/guides/${post.slug}`}
              className="card block p-5 hover:border-[#4fc3f7]"
            >
              <time className="text-xs text-gray-500">{date}</time>
              <h2 className="text-lg font-semibold text-[#e8e6e3] mt-1">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
              <span className="inline-block mt-2 text-xs text-[#4fc3f7]">
                阅读更多 →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
