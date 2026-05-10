"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import type { Deck } from "@/lib/decks";

const CLASSES = [
  { id: "any", name: "不限" },
  { id: "warrior", name: "战士" },
  { id: "mage", name: "法师" },
  { id: "hunter", name: "猎人" },
  { id: "paladin", name: "圣骑士" },
  { id: "priest", name: "牧师" },
  { id: "rogue", name: "潜行者" },
  { id: "shaman", name: "萨满" },
  { id: "warlock", name: "术士" },
  { id: "druid", name: "德鲁伊" },
];

const RANKS = [
  { id: "bronze", name: "青铜" },
  { id: "silver", name: "白银" },
  { id: "gold", name: "黄金" },
  { id: "platinum", name: "白金" },
  { id: "diamond", name: "钻石" },
  { id: "legend", name: "传说" },
];

export default function RecommendPage() {
  const [rank, setRank] = useState("gold");
  const [preferClass, setPreferClass] = useState("any");
  const [budget, setBudget] = useState(8000);
  const [results, setResults] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setSearched(true);
    const supabase = createClient();

    let query = supabase.from("decks").select("*").order("win_rate", { ascending: false });

    if (preferClass !== "any") {
      query = query.eq("hero_class", preferClass);
    }
    query = query.lte("dust_cost", budget);

    const { data } = await query.limit(3);

    if (data && data.length > 0) {
      setResults(data);
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">AI 卡组推荐</h1>
      <p className="text-gray-500 mb-8">
        告诉我们你的情况，为你推荐最合适的卡组
      </p>

      <div className="card p-6 mb-8">
        {/* Rank */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">你的段位</label>
          <div className="flex flex-wrap gap-2">
            {RANKS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRank(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  rank === r.id
                    ? "bg-[#f0b232] text-[#0f1419]"
                    : "bg-[#2a3040] text-gray-400 hover:text-[#f0b232]"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Class */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">偏好职业</label>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setPreferClass(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  preferClass === c.id
                    ? "bg-[#4fc3f7] text-[#0f1419]"
                    : "bg-[#2a3040] text-gray-400 hover:text-[#4fc3f7]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            尘预算: <span className="text-[#4fc3f7]">💎 {budget.toLocaleString()}</span>
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
          {loading ? "分析中..." : "获取推荐"}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <h2 className="text-xl font-semibold gold-text mb-4">推荐结果</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 card p-6 text-center">
              暂无符合条件的卡组，试试调高预算或选择「不限」职业
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((deck, idx) => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.slug}`}
                  className="card block p-5 hover:border-[#f0b232]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className={`text-xs tier-${deck.tier}`}>T{deck.tier}</span>
                    <span className={`text-xs class-${deck.hero_class}`}>
                      {CLASSES.find((c) => c.id === deck.hero_class)?.name || deck.hero_class}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#e8e6e3]">{deck.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>💎 {deck.dust_cost.toLocaleString()}</span>
                    <span className={deck.win_rate >= 55 ? "win-rate-good" : "win-rate-ok"}>
                      胜率 {deck.win_rate}%
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
