"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";

const CLASS_IDS = [
  "any",
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

const RANK_IDS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "legend",
] as const;

const RANK_LABELS_EN: Record<(typeof RANK_IDS)[number], string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  legend: "Legend",
};

const RANK_LABELS_ZH: Record<(typeof RANK_IDS)[number], string> = {
  bronze: "青铜",
  silver: "白银",
  gold: "黄金",
  platinum: "白金",
  diamond: "钻石",
  legend: "传说",
};

export default function RecommendContent() {
  const { t, lang, localePath } = useLanguage();
  const [rank, setRank] = useState<(typeof RANK_IDS)[number]>("gold");
  const [preferClass, setPreferClass] = useState("any");
  const [budget, setBudget] = useState(8000);
  const [results, setResults] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setSearched(true);
    const supabase = createClient();

    let query = supabase
      .from("decks")
      .select("*")
      .order("win_rate", { ascending: false });

    if (preferClass !== "any") {
      query = query.eq("hero_class", preferClass);
    }
    query = query.lte("dust_cost", budget);

    const { data } = await query.limit(3);
    setResults(data ?? []);
    setLoading(false);
  };

  const rankLabel = (id: (typeof RANK_IDS)[number]) =>
    lang === "zh" ? RANK_LABELS_ZH[id] : RANK_LABELS_EN[id];

  const classLabel = (id: string) => {
    if (id === "any") return lang === "zh" ? "不限" : "Any";
    return (t.classes as Record<string, string>)[id] ?? id;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">{t.recommend.title}</h1>
      <p className="text-gray-500 mb-8">{t.recommend.desc}</p>

      <div className="card p-6 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.recommend.rank}
          </label>
          <div className="flex flex-wrap gap-2">
            {RANK_IDS.map((r) => (
              <button
                key={r}
                onClick={() => setRank(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  rank === r
                    ? "bg-[#f0b232] text-[#0f1419]"
                    : "bg-[#2a3040] text-gray-400 hover:text-[#f0b232]"
                }`}
              >
                {rankLabel(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.recommend.preferClass}
          </label>
          <div className="flex flex-wrap gap-2">
            {CLASS_IDS.map((c) => (
              <button
                key={c}
                onClick={() => setPreferClass(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  preferClass === c
                    ? "bg-[#4fc3f7] text-[#0f1419]"
                    : "bg-[#2a3040] text-gray-400 hover:text-[#4fc3f7]"
                }`}
              >
                {classLabel(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.recommend.budget}:{" "}
            <span className="text-[#4fc3f7]">
              {budget.toLocaleString()} {t.decks.dust}
            </span>
          </label>
          <input
            type="range"
            min={2000}
            max={20000}
            step={1000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-[#f0b232]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2,000</span>
            <span>20,000</span>
          </div>
        </div>

        <button
          onClick={handleRecommend}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold hover:bg-[#d4982a] transition-colors disabled:opacity-50"
        >
          {loading
            ? lang === "zh"
              ? "分析中..."
              : "Analyzing..."
            : t.recommend.submit}
        </button>
      </div>

      {searched && (
        <div>
          <h2 className="text-xl font-semibold gold-text mb-4">
            {t.recommend.result}
          </h2>
          {results.length === 0 ? (
            <p className="text-gray-500 card p-6 text-center">
              {lang === "zh"
                ? "暂无符合条件的卡组，试试调高预算或选择「不限」职业"
                : "No matching decks. Try a higher budget or pick \"Any\" class."}
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((deck, idx) => (
                <Link
                  key={deck.id}
                  href={localePath(`/decks/${deck.slug}`)}
                  className="card block p-5 hover:border-[#f0b232]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className={`text-xs tier-${deck.tier}`}>
                      T{deck.tier}
                    </span>
                    <span className={`text-xs class-${deck.hero_class}`}>
                      {classLabel(deck.hero_class)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#e8e6e3]">{deck.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      {deck.dust_cost.toLocaleString()} {t.decks.dust}
                    </span>
                    <span
                      className={
                        deck.win_rate >= 55 ? "win-rate-good" : "win-rate-ok"
                      }
                    >
                      {t.decks.winRate} {deck.win_rate}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
