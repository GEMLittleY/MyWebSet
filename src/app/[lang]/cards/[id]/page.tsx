import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardById, getCardIndex } from "@/lib/cards";
import { getAllDecks } from "@/lib/decks";
import JsonLd from "@/components/JsonLd";
import { getDict, type Lang } from "@/lib/i18n";

export const revalidate = 86400;

type Props = {
  params: Promise<{ lang: string; id: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  const card = getCardById(id);
  if (!card) {
    return { title: lang === "zh" ? "卡片未找到" : "Card not found" };
  }
  const title = lang === "zh" ? card.name_zh : card.name_en;
  const text = lang === "zh" ? card.text_zh : card.text_en;
  return {
    title,
    description: text || undefined,
    alternates: {
      canonical: `/${lang}/cards/${id}`,
      languages: {
        en: `/en/cards/${id}`,
        "zh-CN": `/zh/cards/${id}`,
        "x-default": `/en/cards/${id}`,
      },
    },
    openGraph: {
      title,
      description: text || undefined,
      type: "article",
      images: [
        {
          url: `https://art.hearthstonejson.com/v1/render/latest/${lang === "zh" ? "zhCN" : "enUS"}/512x/${id}.png`,
        },
      ],
    },
  };
}

// Stat the page when the card is referenced from a deck or anywhere else.
// We don't pre-generate all 8k pages; revalidate on demand instead.
export const dynamicParams = true;

export function generateStaticParams() {
  // Skip mass pre-generation; pages are built lazily and cached for a day.
  return [];
}

function stripCardTags(s: string): string {
  return s
    .replace(/<\/?[bi]>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/\$/g, "")
    .replace(/#/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}

export default async function CardDetailPage({ params }: Props) {
  const { lang, id } = await params;
  const card = getCardById(id);
  if (!card) notFound();

  const typedLang = (lang === "zh" ? "zh" : "en") as Lang;
  const t = getDict(typedLang);
  const title = typedLang === "zh" ? card.name_zh : card.name_en;
  const text = stripCardTags(typedLang === "zh" ? card.text_zh : card.text_en);
  const imageBig = `https://art.hearthstonejson.com/v1/render/latest/${typedLang === "zh" ? "zhCN" : "enUS"}/512x/${id}.png`;

  // Find decks that include this card. dbfId is the canonical key in deck.card_list.
  const allDecks = await getAllDecks();
  const decksWithCard = allDecks
    .filter((d) => (d.card_list ?? []).some((c) => c.card_id === card.id || c.card_id === String(card.dbfId)))
    .slice(0, 12);

  const cardIndex = getCardIndex();
  const sameClass = cardIndex
    .filter((c) => c.cardClass === card.cardClass && c.id !== card.id)
    .slice(0, 12);

  const ldData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: text,
    image: imageBig,
    inLanguage: typedLang === "zh" ? "zh-CN" : "en",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${lang}/cards/${id}`,
    },
    about: {
      "@type": "VideoGame",
      name: "Hearthstone",
      publisher: "Blizzard Entertainment",
    },
  };

  return (
    <>
      <JsonLd data={ldData} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href={`/${lang}/cards`}
          className="text-sm text-gray-500 hover:text-[#f0b232] transition-colors"
        >
          {typedLang === "en" ? "← Back to cards" : "← 返回卡片图鉴"}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 mt-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBig}
              alt={title}
              loading="eager"
              className="w-full max-w-[280px] mx-auto"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e6e3] mb-2">
              {title}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {typedLang === "en" ? card.name_zh : card.name_en}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Stat label={typedLang === "zh" ? "费用" : "Cost"} value={String(card.cost ?? 0)} />
              {card.type === "MINION" && (
                <>
                  <Stat label={typedLang === "zh" ? "攻击" : "Attack"} value={String(card.attack ?? 0)} />
                  <Stat label={typedLang === "zh" ? "生命" : "Health"} value={String(card.health ?? 0)} />
                </>
              )}
              {card.type === "WEAPON" && (
                <>
                  <Stat label={typedLang === "zh" ? "攻击" : "Attack"} value={String(card.attack ?? 0)} />
                  <Stat label={typedLang === "zh" ? "耐久" : "Durability"} value={String(card.durability ?? 0)} />
                </>
              )}
              <Stat
                label={typedLang === "zh" ? "类型" : "Type"}
                value={card.type}
              />
              <Stat
                label={typedLang === "zh" ? "稀有度" : "Rarity"}
                value={card.rarity}
              />
            </div>

            {text && (
              <div className="card p-4 mb-6 whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">
                {text}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6 text-xs text-gray-500">
              <span>{card.set}</span>
              {card.race && <span>· {card.race}</span>}
              {card.spellSchool && <span>· {card.spellSchool}</span>}
              {(card.mechanics ?? []).length > 0 && (
                <span>· {card.mechanics.slice(0, 6).join(", ")}</span>
              )}
            </div>
          </div>
        </div>

        {decksWithCard.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold gold-text mb-4">
              {typedLang === "zh" ? "包含此卡的卡组" : "Decks running this card"}
            </h2>
            <ul className="space-y-2">
              {decksWithCard.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/${lang}/decks/${d.slug}`}
                    className="card flex items-center justify-between p-3 hover:border-[#f0b232]"
                  >
                    <span className="text-sm text-[#e8e6e3]">
                      {typedLang === "zh" ? d.title : d.title_en || d.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {d.win_rate}% · T{d.tier}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sameClass.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold gold-text mb-4">
              {typedLang === "zh" ? "同职业卡牌" : "More from this class"}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {sameClass.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/cards/${c.id}`}
                  className="card p-0 overflow-hidden hover:border-[#f0b232] block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://art.hearthstonejson.com/v1/render/latest/${typedLang === "zh" ? "zhCN" : "enUS"}/256x/${c.id}.png`}
                    alt={typedLang === "zh" ? c.name_zh : c.name_en}
                    loading="lazy"
                    className="w-full aspect-[2.5/3.5] object-contain bg-[#0f1419]"
                  />
                  <p className="px-2 py-1.5 text-[11px] text-gray-300 truncate border-t border-[#2a3040]">
                    {typedLang === "zh" ? c.name_zh : c.name_en}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* unused helpers to silence linter for unused locale tokens */}
        <span className="sr-only">{t.siteName}</span>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-base font-semibold text-[#e8e6e3] mt-1">{value}</div>
    </div>
  );
}
