import type { Metadata } from "next";
import Link from "next/link";
import { getAllDecks } from "@/lib/decks";
import { getAllPosts } from "@/lib/posts";
import { getCardIndex } from "@/lib/cards";

export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  const baseTitle = lang === "zh" ? "搜索" : "Search";
  return {
    title: q ? `${baseTitle}: ${q}` : baseTitle,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${lang}/search`,
    },
  };
}

const MAX = {
  decks: 12,
  cards: 24,
  guides: 12,
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const qLower = q.toLowerCase();
  const isZh = lang === "zh";

  if (!q) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-4">
          {isZh ? "搜索" : "Search"}
        </h1>
        <SearchInput lang={lang} initial="" />
        <p className="text-sm text-gray-500 mt-4">
          {isZh
            ? "输入关键词搜索卡组、卡片和攻略"
            : "Type a keyword to search decks, cards and guides"}
        </p>
      </div>
    );
  }

  const [decks, posts] = await Promise.all([getAllDecks(), getAllPosts()]);
  const cards = getCardIndex();

  const deckHits = decks
    .filter((d) => {
      const hay = [d.title, d.title_en, d.hero_class, d.archetype, d.deck_code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qLower);
    })
    .slice(0, MAX.decks);

  const cardHits = cards
    .filter((c) => `${c.name_en} ${c.name_zh}`.toLowerCase().includes(qLower))
    .slice(0, MAX.cards);

  const guideHits = posts
    .filter((p) =>
      `${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(qLower),
    )
    .slice(0, MAX.guides);

  const total = deckHits.length + cardHits.length + guideHits.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl font-bold gold-text mb-2">
        {isZh ? "搜索结果" : "Search results"}
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        {isZh ? `「${q}」共 ${total} 条结果` : `${total} hit${total === 1 ? "" : "s"} for "${q}"`}
      </p>

      <SearchInput lang={lang} initial={q} />

      {total === 0 && (
        <p className="text-center text-gray-500 py-12">
          {isZh ? "没有找到相关内容" : "Nothing matched your query"}
        </p>
      )}

      {deckHits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold gold-text mb-3">
            {isZh ? `卡组 (${deckHits.length})` : `Decks (${deckHits.length})`}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deckHits.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/${lang}/decks/${d.slug}`}
                  className="card block p-4 hover:border-[#f0b232]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#e8e6e3]">
                      {isZh ? d.title : d.title_en || d.title}
                    </span>
                    <span className={`text-xs tier-${d.tier}`}>T{d.tier}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-3">
                    <span className={`class-${d.hero_class}`}>
                      {d.hero_class}
                    </span>
                    <span>{d.win_rate}% WR</span>
                    <span>💎 {d.dust_cost.toLocaleString()}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cardHits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold gold-text mb-3">
            {isZh ? `卡片 (${cardHits.length})` : `Cards (${cardHits.length})`}
          </h2>
          <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {cardHits.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${lang}/cards/${c.id}`}
                  className="card block p-0 overflow-hidden hover:border-[#f0b232]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://art.hearthstonejson.com/v1/render/latest/${isZh ? "zhCN" : "enUS"}/256x/${c.id}.png`}
                    alt={isZh ? c.name_zh : c.name_en}
                    loading="lazy"
                    className="w-full aspect-[2.5/3.5] object-contain bg-[#0f1419]"
                  />
                  <p className="px-2 py-1.5 text-[11px] text-gray-300 truncate border-t border-[#2a3040]">
                    {isZh ? c.name_zh : c.name_en}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guideHits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold gold-text mb-3">
            {isZh ? `攻略 (${guideHits.length})` : `Guides (${guideHits.length})`}
          </h2>
          <ul className="space-y-3">
            {guideHits.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${lang}/guides/${p.slug}`}
                  className="card block p-4 hover:border-[#f0b232]"
                >
                  <h3 className="text-sm font-semibold text-[#e8e6e3]">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {p.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SearchInput({ lang, initial }: { lang: string; initial: string }) {
  const placeholder =
    lang === "zh" ? "搜索卡组、卡片、攻略…" : "Search decks, cards, guides…";
  return (
    <form method="get" action={`/${lang}/search`} className="relative">
      <input
        type="search"
        name="q"
        defaultValue={initial}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-4 py-2.5 pl-10 text-sm text-[#e8e6e3] placeholder:text-gray-600 focus:outline-none focus:border-[#f0b232]"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </form>
  );
}
