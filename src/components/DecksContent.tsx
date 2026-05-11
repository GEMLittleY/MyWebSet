"use client";

import { useMemo, useState } from "react";
import DeckCard from "./DeckCard";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";

const CLASS_IDS = [
  "all",
  "warrior",
  "mage",
  "hunter",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "druid",
  "demon-hunter",
  "death-knight",
];

const ARCHETYPE_IDS = ["all", "aggro", "midrange", "control", "combo"];
const MODE_IDS = ["standard", "wild"] as const;

type SortKey = "winRate" | "dust" | "tier";

export default function DecksContent({
  allDecks,
  initialClassFilter,
  initialTypeFilter,
  initialModeFilter,
}: {
  allDecks: Deck[];
  initialClassFilter: string;
  initialTypeFilter: string;
  initialModeFilter: "standard" | "wild";
}) {
  const { t, lang, localePath } = useLanguage();
  const classFilter = initialClassFilter;
  const typeFilter = initialTypeFilter;
  const modeFilter = initialModeFilter;
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("winRate");

  const decksOfMode = useMemo(
    () => allDecks.filter((d) => (d.game_mode ?? "standard") === modeFilter),
    [allDecks, modeFilter],
  );

  const filteredDecks = useMemo(() => {
    let list = decksOfMode;
    if (classFilter !== "all") {
      list = list.filter((d) => d.hero_class === classFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((d) => d.archetype === typeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const hay = [
          d.title,
          d.title_en,
          d.hero_class,
          d.archetype,
          d.deck_code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortKey === "winRate") return b.win_rate - a.win_rate;
      if (sortKey === "dust") return a.dust_cost - b.dust_cost;
      if (sortKey === "tier") return a.tier - b.tier;
      return 0;
    });
    return sorted;
  }, [decksOfMode, classFilter, typeFilter, query, sortKey]);

  const getClassName = (id: string) => {
    if (id === "all") return t.decks.allClasses;
    return (t.classes as Record<string, string>)[id] || id;
  };
  const getArchetypeName = (id: string) => {
    if (id === "all") return t.decks.allTypes;
    return (t.archetypes as Record<string, string>)[id] || id;
  };
  const getModeName = (id: string) =>
    id === "wild" ? t.decks.modeWild : t.decks.modeStandard;

  const buildHref = (
    overrides: Partial<{ mode: string; cls: string; type: string }>,
  ) => {
    const m = overrides.mode ?? modeFilter;
    const c = overrides.cls ?? classFilter;
    const tp = overrides.type ?? typeFilter;
    const params = new URLSearchParams();
    params.set("mode", m);
    if (c !== "all") params.set("class", c);
    if (tp !== "all") params.set("type", tp);
    return `${localePath("/decks")}?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold gold-text mb-2">
        {t.decks.title}
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        {filteredDecks.length} / {decksOfMode.length} {t.nav.decks}
      </p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5 border-b border-[#2a3040]">
        {MODE_IDS.map((id) => (
          <a
            key={id}
            href={buildHref({ mode: id })}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              modeFilter === id
                ? "border-[#f0b232] text-[#f0b232]"
                : "border-transparent text-gray-400 hover:text-[#f0b232]"
            }`}
          >
            {getModeName(id)}
          </a>
        ))}
      </div>

      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.decks.search}
            aria-label={t.decks.search}
            className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-4 py-2 pl-9 text-sm text-[#e8e6e3] placeholder:text-gray-600 focus:outline-none focus:border-[#f0b232]"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">{t.decks.sort}:</span>
          {(
            [
              { id: "winRate", label: t.decks.sortByWinRate },
              { id: "dust", label: t.decks.sortByDust },
              { id: "tier", label: t.decks.sortByTier },
            ] as { id: SortKey; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortKey(opt.id)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                sortKey === opt.id
                  ? "bg-[#4fc3f7] text-[#0f1419]"
                  : "bg-[#1a1f2e] text-gray-400 hover:text-[#4fc3f7] border border-[#2a3040]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Class filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CLASS_IDS.map((id) => (
          <a
            key={id}
            href={buildHref({ cls: id })}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              classFilter === id
                ? "bg-[#f0b232] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
            }`}
          >
            {getClassName(id)}
          </a>
        ))}
      </div>

      {/* Archetype filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {ARCHETYPE_IDS.map((id) => (
          <a
            key={id}
            href={buildHref({ type: id })}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              typeFilter === id
                ? "bg-[#4fc3f7] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#4fc3f7] border border-[#2a3040]"
            }`}
          >
            {getArchetypeName(id)}
          </a>
        ))}
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDecks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>

      {filteredDecks.length === 0 && (
        <p className="text-center text-gray-500 py-12">
          {lang === "en"
            ? "No decks match your filters"
            : t.decks.noResults}
        </p>
      )}
    </div>
  );
}
