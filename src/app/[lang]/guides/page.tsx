import { getAllPosts } from "@/lib/posts";
import GuidesContent from "@/components/GuidesContent";
import type { Metadata } from "next";
import { getDict, type Lang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict((lang === "zh" ? "zh" : "en") as Lang);
  return {
    title: t.guides.title,
    description:
      lang === "zh"
        ? "炉石传说上分攻略、版本解析和新手教程"
        : "Hearthstone climbing strategy, meta analysis and beginner tutorials",
    alternates: {
      canonical: `/${lang}/guides`,
      languages: {
        en: "/en/guides",
        "zh-CN": "/zh/guides",
        "x-default": "/en/guides",
      },
    },
  };
}

export default async function GuidesPage() {
  const posts = await getAllPosts();
  return <GuidesContent posts={posts} />;
}
