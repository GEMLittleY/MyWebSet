import type { Metadata } from "next";
import { Suspense } from "react";
import DeckBuilder from "@/components/DeckBuilder";
import { getCardIndex } from "@/lib/cards";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "卡组构筑器" : "Deck Builder",
    description:
      lang === "zh"
        ? "选择职业，自由组卡 30 张，一键导出炉石卡组代码。"
        : "Pick a class, build a 30-card deck, export a Hearthstone deck code in one click.",
    alternates: {
      canonical: `/${lang}/builder`,
      languages: {
        en: "/en/builder",
        "zh-CN": "/zh/builder",
        "x-default": "/en/builder",
      },
    },
  };
}

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cards = getCardIndex();
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-sm text-gray-500">…</p>
        </div>
      }
    >
      <DeckBuilder cards={cards} lang={lang === "zh" ? "zh" : "en"} />
    </Suspense>
  );
}
