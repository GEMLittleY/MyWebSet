import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuideDetailContent from "@/components/GuideDetailContent";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

function ogImageFor(post: NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>): string {
  const params = new URLSearchParams({
    title: post.title,
    subtitle: post.excerpt ?? "",
  });
  return `${SITE_URL}/api/og?${params.toString()}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: lang === "zh" ? "文章未找到" : "Article not found" };
  const ogImage = post.cover_image ?? ogImageFor(post);
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
      url: `${SITE_URL}/${lang}/guides/${slug}`,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
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
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const ldData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    datePublished: post.published_at,
    dateModified: post.published_at,
    image: post.cover_image ?? ogImageFor(post),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${lang}/guides/${slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "HearthGuide",
    },
  };

  return (
    <>
      <JsonLd data={ldData} />
      <GuideDetailContent post={post} />
    </>
  );
}
