import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getCardIndex } from "@/lib/cards";
import { cardClassToDeckClass } from "@/lib/cards-meta";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

type Lang = "en" | "zh";

type Row = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  hero_class: string;
  archetype: string | null;
  deck_code: string | null;
  card_list: Array<{ card_id: string | number; count: number }>;
  dust_cost: number;
  parent_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profile: { display_name: string | null; avatar_url: string | null } | null;
};

// Use a server-side client with the anon key. RLS allows public reads only
// when is_public = true, so this is safe to share with crawlers.
function getPublic(): ReturnType<typeof createClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

async function loadDeck(id: number): Promise<Row | null> {
  const supabase = getPublic();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_decks")
    .select(
      "id,user_id,title,description,hero_class,archetype,deck_code,card_list,dust_cost,parent_slug,is_public,created_at,updated_at,profile:profiles(display_name,avatar_url)",
    )
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Row;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return { title: "Deck" };
  const deck = await loadDeck(numId);
  if (!deck) {
    return { title: lang === "zh" ? "卡组未找到" : "Deck not found" };
  }
  return {
    title: deck.title,
    description: deck.description ?? undefined,
    alternates: {
      canonical: `/${lang}/u/decks/${id}`,
      languages: {
        en: `/en/u/decks/${id}`,
        "zh-CN": `/zh/u/decks/${id}`,
        "x-default": `/en/u/decks/${id}`,
      },
    },
    openGraph: {
      title: deck.title,
      description: deck.description ?? undefined,
      type: "article",
      url: `${SITE_URL}/${lang}/u/decks/${id}`,
    },
  };
}

export default async function PublicUserDeckPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const typedLang = (lang === "zh" ? "zh" : "en") as Lang;
  const deck = await loadDeck(numId);
  if (!deck) notFound();

  // Resolve card list to display names + costs.
  const cardIndex = getCardIndex();
  const byId = new Map(cardIndex.map((c) => [c.id, c] as const));
  const byDbf = new Map(cardIndex.map((c) => [c.dbfId, c] as const));
  const enriched = deck.card_list
    .map((entry) => {
      const card =
        typeof entry.card_id === "string"
          ? byId.get(entry.card_id)
          : byDbf.get(entry.card_id);
      return card ? { card, count: entry.count } : null;
    })
    .filter(
      (x): x is { card: NonNullable<ReturnType<typeof byId.get>>; count: number } =>
        x !== null,
    )
    .sort((a, b) => {
      if (a.card.cost !== b.card.cost)
        return (a.card.cost ?? 0) - (b.card.cost ?? 0);
      const an = typedLang === "zh" ? a.card.name_zh : a.card.name_en;
      const bn = typedLang === "zh" ? b.card.name_zh : b.card.name_en;
      return an.localeCompare(bn);
    });

  const author = deck.profile?.display_name ?? "Anonymous";
  const heroClass = cardClassToDeckClass(deck.hero_class);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: deck.title,
    description: deck.description ?? deck.title,
    inLanguage: typedLang === "zh" ? "zh-CN" : "en",
    author: { "@type": "Person", name: author },
    datePublished: deck.created_at,
    dateModified: deck.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${lang}/u/decks/${id}`,
    },
  };

  return (
    <>
      <JsonLd data={ld} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-xs text-gray-500 mb-2">
          {typedLang === "zh" ? "用户卡组" : "Community deck"}
        </p>
        <h1 className="text-3xl font-bold gold-text mb-2">{deck.title}</h1>
        <p className="text-sm text-gray-400 mb-1">
          {typedLang === "zh" ? "作者" : "by"}{" "}
          <span className="text-[#e8e6e3]">{author}</span> ·{" "}
          <span className={`class-${heroClass}`}>{heroClass}</span> · 💎{" "}
          {deck.dust_cost.toLocaleString()}{" "}
          {typedLang === "zh" ? "尘" : "dust"}
        </p>
        {deck.parent_slug && (
          <p className="text-xs text-gray-500 mb-4">
            {typedLang === "zh" ? "源自" : "Forked from"}{" "}
            <Link
              href={`/${lang}/decks/${deck.parent_slug}`}
              className="text-[#4fc3f7] hover:underline"
            >
              {deck.parent_slug}
            </Link>
          </p>
        )}

        {deck.description && (
          <p className="text-sm text-gray-300 mb-6 whitespace-pre-wrap">
            {deck.description}
          </p>
        )}

        {deck.deck_code && (
          <div className="card p-3 mb-6 flex items-center gap-3">
            <code className="text-xs text-gray-400 truncate flex-1 min-w-0">
              {deck.deck_code}
            </code>
            <Link
              href={`/${lang}/builder?from=user-${deck.id}`}
              className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-xs text-gray-300 hover:border-[#4fc3f7] hover:text-[#4fc3f7] whitespace-nowrap"
            >
              {typedLang === "zh" ? "在构筑器打开" : "Open in builder"}
            </Link>
          </div>
        )}

        <div className="card p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-[#e8e6e3] mb-3">
            {typedLang === "zh" ? "卡牌列表" : "Card list"}
          </h2>
          <ul className="space-y-1">
            {enriched.map(({ card, count }) => (
              <li
                key={card.id}
                className="flex items-center gap-2 hover:bg-[#0f1419]/60 rounded px-1.5 py-1"
              >
                <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0f1419] text-[10px] text-gray-300">
                  {card.cost ?? 0}
                </span>
                <Link
                  href={`/${lang}/cards/${card.id}`}
                  className="flex-1 text-xs text-gray-200 truncate hover:text-[#f0b232]"
                >
                  {typedLang === "zh" ? card.name_zh : card.name_en}
                </Link>
                {count > 1 && (
                  <span className="text-[10px] text-gray-400">×{count}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
