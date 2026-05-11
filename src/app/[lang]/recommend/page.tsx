import type { Metadata } from "next";
import RecommendContent from "@/components/RecommendContent";
import { getDict, type Lang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict((lang === "zh" ? "zh" : "en") as Lang);
  return {
    title: t.recommend.title,
    description: t.recommend.desc,
    alternates: {
      canonical: `/${lang}/recommend`,
      languages: {
        en: "/en/recommend",
        "zh-CN": "/zh/recommend",
        "x-default": "/en/recommend",
      },
    },
  };
}

export default function RecommendPage() {
  return <RecommendContent />;
}
