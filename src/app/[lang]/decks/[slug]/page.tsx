import { getDeckBySlug, getAllDecks } from "@/lib/decks";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DeckDetailContent from "@/components/DeckDetailContent";
import { getDict, type Lang } from "@/lib/i18n";

export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const deck = await getDeckBySlug(slug);
  const t = getDict((lang === "zh" ? "zh" : "en") as Lang);
  if (!deck) {
    return {
      title: lang === "zh" ? "卡组未找到" : "Deck not found",
    };
  }
  const title = lang === "zh" ? deck.title : deck.title_en || deck.title;
  return {
    title,
    description:
      lang === "zh"
        ? `${deck.title_en || deck.title} · ${t.decks.winRate} ${deck.win_rate}% · ${t.decks.dust} ${deck.dust_cost}`
        : `${deck.title} · Win rate ${deck.win_rate}% · Dust ${deck.dust_cost}`,
    alternates: {
      canonical: `/${lang}/decks/${slug}`,
      languages: {
        en: `/en/decks/${slug}`,
        "zh-CN": `/zh/decks/${slug}`,
        "x-default": `/en/decks/${slug}`,
      },
    },
    openGraph: {
      title,
      type: "article",
    },
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const decks = await getAllDecks();
  // Cartesian: each deck rendered twice (en + zh).
  return decks.flatMap((d) => [
    { lang: "en", slug: d.slug },
    { lang: "zh", slug: d.slug },
  ]);
}

export default async function DeckDetailPage({ params }: Props) {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck) notFound();

  return <DeckDetailContent deck={deck} />;
}
