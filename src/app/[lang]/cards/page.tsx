import type { Metadata } from "next";
import CardsBrowser from "@/components/CardsBrowser";
import { getCardIndex } from "@/lib/cards";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "卡片图鉴" : "Card Browser",
    description:
      lang === "zh"
        ? "全部可收藏卡片，支持按职业、费用、类型、稀有度筛选与搜索。"
        : "Browse every collectible Hearthstone card. Filter by class, cost, type and rarity.",
    alternates: {
      canonical: `/${lang}/cards`,
      languages: {
        en: "/en/cards",
        "zh-CN": "/zh/cards",
        "x-default": "/en/cards",
      },
    },
  };
}

export default async function CardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cards = getCardIndex();
  return <CardsBrowser cards={cards} lang={lang === "zh" ? "zh" : "en"} />;
}
