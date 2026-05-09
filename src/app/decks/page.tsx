import { getAllDecks } from "@/lib/decks";
import DeckCard from "@/components/DeckCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "卡组库 - HearthGuide",
  description: "炉石传说最新强势卡组合集，按职业和类型筛选",
};

const CLASSES = [
  { id: "all", name: "全部" },
  { id: "warrior", name: "战士" },
  { id: "mage", name: "法师" },
  { id: "hunter", name: "猎人" },
  { id: "paladin", name: "圣骑" },
  { id: "priest", name: "牧师" },
  { id: "rogue", name: "潜行者" },
  { id: "shaman", name: "萨满" },
  { id: "warlock", name: "术士" },
  { id: "druid", name: "德鲁伊" },
];

export default async function DecksPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; type?: string }>;
}) {
  const params = await searchParams;
  const allDecks = await getAllDecks();
  const classFilter = params.class || "all";
  const typeFilter = params.type || "all";

  let filteredDecks = allDecks;
  if (classFilter !== "all") {
    filteredDecks = filteredDecks.filter((d) => d.hero_class === classFilter);
  }
  if (typeFilter !== "all") {
    filteredDecks = filteredDecks.filter((d) => d.archetype === typeFilter);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">卡组库</h1>
      <p className="text-gray-500 mb-8">
        共 {allDecks.length} 套卡组 · 按职业和类型筛选
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CLASSES.map((c) => (
          <a
            key={c.id}
            href={`/decks?class=${c.id}${typeFilter !== "all" ? `&type=${typeFilter}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              classFilter === c.id
                ? "bg-[#f0b232] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: "all", name: "全部类型" },
          { id: "aggro", name: "快攻" },
          { id: "midrange", name: "中速" },
          { id: "control", name: "控制" },
          { id: "combo", name: "组合技" },
        ].map((t) => (
          <a
            key={t.id}
            href={`/decks?class=${classFilter}&type=${t.id}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === t.id
                ? "bg-[#4fc3f7] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#4fc3f7] border border-[#2a3040]"
            }`}
          >
            {t.name}
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
        <p className="text-center text-gray-500 py-12">暂无符合条件的卡组</p>
      )}
    </div>
  );
}
