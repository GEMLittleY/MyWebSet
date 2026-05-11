"use client";

import DeckCard from "./DeckCard";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";

const CLASS_IDS = [
  "all", "warrior", "mage", "hunter", "paladin", "priest",
  "rogue", "shaman", "warlock", "druid", "demon-hunter", "death-knight",
];

const ARCHETYPE_IDS = ["all", "aggro", "midrange", "control", "combo"];
const MODE_IDS = ["standard", "wild"] as const;

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
  const { t, localePath } = useLanguage();
  const classFilter = initialClassFilter;
  const typeFilter = initialTypeFilter;
  const modeFilter = initialModeFilter;

  const decksOfMode = allDecks.filter(
    (d) => (d.game_mode ?? "standard") === modeFilter,
  );
  let filteredDecks = decksOfMode;
  if (classFilter !== "all") {
    filteredDecks = filteredDecks.filter((d) => d.hero_class === classFilter);
  }
  if (typeFilter !== "all") {
    filteredDecks = filteredDecks.filter((d) => d.archetype === typeFilter);
  }

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

      {/* Class filters — horizontally scrollable on mobile */}
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

      {/* Archetype filters — horizontally scrollable on mobile */}
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
          {t.nav.home === "Home"
            ? "No decks match your filters"
            : "暂无符合条件的卡组"}
        </p>
      )}
    </div>
  );
}
