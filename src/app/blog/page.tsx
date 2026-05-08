import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "博客 - MyWebSet",
  description: "所有博客文章",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        所有文章
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        共 {posts.length} 篇文章
      </p>
      <div className="mt-10 space-y-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
