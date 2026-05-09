"use client";

import DeckCard from "./DeckCard";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";

const CLASS_IDS = [
  "all", "warrior", "mage", "hunter", "paladin", "priest",
  "rogue", "shaman", "warlock", "druid", "demon-hunter", "death-knight",
];

const ARCHETYPE_IDS = ["all", "aggro", "midrange", "control", "combo"];

export default function DecksContent({
  allDecks,
  initialClassFilter,
  initialTypeFilter,
}: {
  allDecks: Deck[];
  initialClassFilter: string;
  initialTypeFilter: string;
}) {
  const { t } = useLanguage();
  const classFilter = initialClassFilter;
  const typeFilter = initialTypeFilter;

  let filteredDecks = allDecks;
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">{t.decks.title}</h1>
      <p className="text-gray-500 mb-8">
        {allDecks.length} {t.nav.decks}
      </p>

      {/* Class Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CLASS_IDS.map((id) => (
          <a
            key={id}
            href={`/decks?class=${id}${typeFilter !== "all" ? `&type=${typeFilter}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              classFilter === id
                ? "bg-[#f0b232] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
            }`}
          >
            {getClassName(id)}
          </a>
        ))}
      </div>

      {/* Archetype Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {ARCHETYPE_IDS.map((id) => (
          <a
            key={id}
            href={`/decks?class=${classFilter}&type=${id}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
          {t.nav.home === "Home" ? "No decks match your filters" : "暂无符合条件的卡组"}
        </p>
      )}
    </div>
  );
}
