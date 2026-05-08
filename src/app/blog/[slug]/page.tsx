import { getPostBySlug, getAllPosts } from "@/lib/posts";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: `${post.title} - MyWebSet`,
    description: post.excerpt,
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

function renderMarkdown(content: string) {
  return content
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      if (/^\d+\. /.test(line))
        return `<li>${line.replace(/^\d+\. /, "")}</li>`;
      if (line.startsWith("> "))
        return `<blockquote><p>${line.slice(2)}</p></blockquote>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${line}</p>`;
    })
    .join("")
    .replace(/<\/li>\n?<li>/g, "</li><li>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const date = new Date(post.published_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-8"
      >
        ← 返回文章列表
      </Link>

      <article>
        <header className="mb-10">
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {date}
          </time>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            {post.title}
          </h1>
        </header>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </div>
  );
}
