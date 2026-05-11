import { getAllDecks } from "@/lib/decks";
import DecksContent from "@/components/DecksContent";
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
    title: t.decks.title,
    description: t.hero.desc,
    alternates: {
      canonical: `/${lang}/decks`,
      languages: {
        en: "/en/decks",
        "zh-CN": "/zh/decks",
        "x-default": "/en/decks",
      },
    },
  };
}

export default async function DecksPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ class?: string; type?: string; mode?: string }>;
}) {
  await params;
  const sp = await searchParams;
  const allDecks = await getAllDecks();
  const classFilter = sp.class || "all";
  const typeFilter = sp.type || "all";
  const modeFilter = sp.mode === "wild" ? "wild" : "standard";

  return (
    <DecksContent
      allDecks={allDecks}
      initialClassFilter={classFilter}
      initialTypeFilter={typeFilter}
      initialModeFilter={modeFilter}
    />
  );
}
