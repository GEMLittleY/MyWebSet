import { getPostBySlug, getAllPosts } from "@/lib/posts";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: `${post.title} - HearthGuide`,
    description: post.excerpt,
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const date = new Date(post.published_at).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/guides"
        className="text-sm text-gray-500 hover:text-[#f0b232] transition-colors"
      >
        ← 返回攻略列表
      </Link>

      <article className="mt-6">
        <header className="mb-8">
          <time className="text-sm text-gray-500">{date}</time>
          <h1 className="mt-2 text-3xl font-bold text-[#e8e6e3]">
            {post.title}
          </h1>
        </header>
        <MarkdownRenderer content={post.content} />
      </article>
    </div>
  );
}
