import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuideDetailContent from "@/components/GuideDetailContent";

export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: lang === "zh" ? "文章未找到" : "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${lang}/guides/${slug}`,
      languages: {
        en: `/en/guides/${slug}`,
        "zh-CN": `/zh/guides/${slug}`,
        "x-default": `/en/guides/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.flatMap((post) => [
    { lang: "en", slug: post.slug },
    { lang: "zh", slug: post.slug },
  ]);
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return <GuideDetailContent post={post} />;
}
