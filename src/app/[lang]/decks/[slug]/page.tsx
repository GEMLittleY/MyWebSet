import { getDeckBySlug, getAllDecks } from "@/lib/decks";
import { getCardIndex } from "@/lib/cards";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DeckDetailContent from "@/components/DeckDetailContent";
import JsonLd from "@/components/JsonLd";
import { type Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";
import type { DeckCard } from "@/lib/collection-diff";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

function ogImageFor(
  deck: NonNullable<Awaited<ReturnType<typeof getDeckBySlug>>>,
  lang: Lang,
): string {
  const params = new URLSearchParams({ slug: deck.slug, lang });
  return `${SITE_URL}/api/og/deck?${params.toString()}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const deck = await getDeckBySlug(slug);
  const t = getDict((lang === "zh" ? "zh" : "en") as Lang);
  if (!deck) {
    return { title: lang === "zh" ? "卡组未找到" : "Deck not found" };
  }
  const title = lang === "zh" ? deck.title : deck.title_en || deck.title;
  const description =
    lang === "zh"
      ? `${deck.title_en || deck.title} · ${t.decks.winRate} ${deck.win_rate}% · ${deck.dust_cost} ${t.decks.dust}`
      : `${deck.title} · ${deck.win_rate}% win rate · ${deck.dust_cost} dust`;
  const ogImage = ogImageFor(deck, (lang === "zh" ? "zh" : "en") as Lang);

  return {
    title,
    description,
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
      description,
      type: "article",
      url: `${SITE_URL}/${lang}/decks/${slug}`,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const decks = await getAllDecks();
  return decks.flatMap((d) => [
    { lang: "en", slug: d.slug },
    { lang: "zh", slug: d.slug },
  ]);
}

export default async function DeckDetailPage({ params }: Props) {
  const { lang, slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck) notFound();

  const typedLang = (lang === "zh" ? "zh" : "en") as Lang;
  const title = typedLang === "zh" ? deck.title : deck.title_en || deck.title;
  const ldData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    inLanguage: typedLang === "zh" ? "zh-CN" : "en",
    datePublished: deck.published_at ?? deck.created_at,
    dateModified: deck.created_at,
    image: ogImageFor(deck, typedLang),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${lang}/decks/${slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "HearthGuide",
    },
    about: {
      "@type": "VideoGame",
      name: "Hearthstone",
      publisher: "Blizzard Entertainment",
    },
  };

  // Enrich each entry in deck.card_list with rarity + dbf id from the local
  // cards index, so the collection-diff panel can run client-side without
  // needing another round trip.
  const cardIndex = getCardIndex();
  const byStringId = new Map(cardIndex.map((c) => [c.id, c] as const));
  const enrichedCards: DeckCard[] = [];
  for (const entry of deck.card_list ?? []) {
    if (typeof entry.card_id !== "string") continue;
    const lookup = byStringId.get(entry.card_id);
    if (!lookup) continue;
    enrichedCards.push({
      card_dbf_id: lookup.dbfId,
      card_id: lookup.id,
      count: entry.count,
      rarity: lookup.rarity,
      name_en: lookup.name_en,
      name_zh: lookup.name_zh,
      cost: lookup.cost ?? entry.cost ?? 0,
    });
  }

  return (
    <>
      <JsonLd data={ldData} />
      <DeckDetailContent deck={deck} enrichedCards={enrichedCards} />
    </>
  );
}
