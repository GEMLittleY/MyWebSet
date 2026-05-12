"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useFavorites, type FavoriteType } from "@/lib/favorites";
import type { Deck } from "@/lib/decks";
import type { Post } from "@/lib/supabase";

type Lang = "en" | "zh";

type CardSummary = {
  id: string;
  name_en: string;
  name_zh: string;
  cardClass?: string;
};

export default function FavoritesContent({ lang }: { lang: Lang }) {
  const fav = useFavorites();
  const [tab, setTab] = useState<FavoriteType>("deck");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [guides, setGuides] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  const t =
    lang === "zh"
      ? {
          title: "我的收藏",
          loading: "加载中…",
          notSignedIn: "登录后即可看到你的收藏列表。",
          signIn: "登录",
          tabs: { deck: "卡组", card: "卡牌", guide: "攻略" },
          empty: "还没有收藏任何条目。",
          back: "← 返回账户",
        }
      : {
          title: "Favourites",
          loading: "Loading…",
          notSignedIn: "Sign in to view your saved items.",
          signIn: "Sign in",
          tabs: { deck: "Decks", card: "Cards", guide: "Guides" },
          empty: "Nothing saved yet.",
          back: "← Back to account",
        };

  const ids = useMemo(() => {
    const decks: string[] = [];
    const cards: string[] = [];
    const guides: string[] = [];
    fav.index.forEach((_v, k) => {
      const [type, ...rest] = k.split(":");
      const id = rest.join(":");
      if (type === "deck") decks.push(id);
      else if (type === "card") cards.push(id);
      else if (type === "guide") guides.push(id);
    });
    return { decks, cards, guides };
  }, [fav.index]);

  useEffect(() => {
    if (fav.loading || !fav.userId) return;
    const cancelled = { current: false };
    const supabase = createClient();

    Promise.all([
      ids.decks.length > 0
        ? supabase.from("decks").select("*").in("slug", ids.decks)
        : Promise.resolve({ data: [] as Deck[], error: null }),
      ids.guides.length > 0
        ? supabase.from("posts").select("*").in("slug", ids.guides)
        : Promise.resolve({ data: [] as Post[], error: null }),
      ids.cards.length > 0
        ? fetch(`/api/favorites/cards?ids=${encodeURIComponent(ids.cards.join(","))}`)
            .then((r) => (r.ok ? r.json() : { cards: [] }))
            .catch(() => ({ cards: [] }))
        : Promise.resolve({ cards: [] as CardSummary[] }),
    ]).then(([deckRes, postRes, cardRes]) => {
      if (cancelled.current) return;
      setDecks(((deckRes as { data?: Deck[] }).data ?? []) as Deck[]);
      setGuides(((postRes as { data?: Post[] }).data ?? []) as Post[]);
      setCards(((cardRes as { cards?: CardSummary[] }).cards ?? []) as CardSummary[]);
      setLoaded(true);
    });

    return () => {
      cancelled.current = true;
    };
  }, [fav.loading, fav.userId, ids.decks, ids.cards, ids.guides]);

  if (fav.loading || (fav.userId && !loaded)) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-6">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!fav.userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-3">{t.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{t.notSignedIn}</p>
        <Link
          href={`/${lang}/login?next=/${lang}/account/favorites`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  const counts = {
    deck: ids.decks.length,
    card: ids.cards.length,
    guide: ids.guides.length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold gold-text mb-2">{t.title}</h1>
      <p className="text-xs text-gray-500 mb-6">
        <Link href={`/${lang}/account`} className="hover:text-[#f0b232]">
          {t.back}
        </Link>
      </p>

      <div className="flex gap-1 mb-6 border-b border-[#2a3040]">
        {(["deck", "card", "guide"] as FavoriteType[]).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setTab(tk)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === tk
                ? "border-[#f0b232] text-[#f0b232]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.tabs[tk]} <span className="text-xs text-gray-500">({counts[tk]})</span>
          </button>
        ))}
      </div>

      {tab === "deck" && (
        <DeckList lang={lang} decks={decks} emptyText={t.empty} />
      )}
      {tab === "card" && (
        <CardList lang={lang} cards={cards} emptyText={t.empty} />
      )}
      {tab === "guide" && (
        <GuideList lang={lang} guides={guides} emptyText={t.empty} />
      )}
    </div>
  );
}

function DeckList({
  lang,
  decks,
  emptyText,
}: {
  lang: Lang;
  decks: Deck[];
  emptyText: string;
}) {
  if (decks.length === 0) return <p className="text-sm text-gray-500">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {decks.map((d) => (
        <li key={d.slug}>
          <Link
            href={`/${lang}/decks/${d.slug}`}
            className="card p-4 flex items-center justify-between hover:border-[#f0b232]/40"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#e8e6e3] truncate">
                {lang === "zh" ? d.title : d.title_en || d.title}
              </p>
              <p className="text-xs text-gray-500">
                T{d.tier} · {d.win_rate}% · {d.dust_cost.toLocaleString()} dust
              </p>
            </div>
            <span className="text-xs text-[#4fc3f7]">
              {lang === "zh" ? "查看 →" : "View →"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CardList({
  lang,
  cards,
  emptyText,
}: {
  lang: Lang;
  cards: CardSummary[];
  emptyText: string;
}) {
  if (cards.length === 0) return <p className="text-sm text-gray-500">{emptyText}</p>;
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <li key={c.id}>
          <Link
            href={`/${lang}/cards/${c.id}`}
            className="card p-3 block hover:border-[#f0b232]/40"
          >
            <p className="text-sm text-[#e8e6e3] truncate">
              {lang === "zh" ? c.name_zh : c.name_en}
            </p>
            <p className="text-xs text-gray-500 truncate">{c.cardClass ?? ""}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function GuideList({
  lang,
  guides,
  emptyText,
}: {
  lang: Lang;
  guides: Post[];
  emptyText: string;
}) {
  if (guides.length === 0) return <p className="text-sm text-gray-500">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {guides.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/${lang}/guides/${p.slug}`}
            className="card p-4 flex items-center justify-between hover:border-[#f0b232]/40"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#e8e6e3] truncate">{p.title}</p>
              <p className="text-xs text-gray-500 truncate">{p.excerpt}</p>
            </div>
            <span className="text-xs text-[#4fc3f7] shrink-0">
              {lang === "zh" ? "阅读 →" : "Read →"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
