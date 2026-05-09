"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { createClient } from "@/lib/supabase-browser";
import type { Deck } from "@/lib/decks";

const CLASS_NAMES: Record<string, string> = {
  warrior: "战士", mage: "法师", hunter: "猎人", paladin: "圣骑士",
  priest: "牧师", rogue: "潜行者", shaman: "萨满", warlock: "术士",
  druid: "德鲁伊",
};

export default function DeckDetailPage() {
  const params = useParams();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("decks")
      .select("*")
      .eq("slug", params.slug)
      .single()
      .then(({ data }) => {
        if (data) setDeck(data);
        else {
          // Fallback demo data
          fetch(`/api/deck?slug=${params.slug}`).catch(() => {});
        }
      });
  }, [params.slug]);

  const copyDeckCode = () => {
    if (!deck) return;
    navigator.clipboard.writeText(deck.deck_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  const maxCards = Math.max(...(deck.card_list || []).map((c) => c.count), 1);
  const manaCurve: number[] = Array(8).fill(0);
  (deck.card_list || []).forEach((card) => {
    const idx = Math.min(card.cost, 7);
    manaCurve[idx] += card.count;
  });
  const maxMana = Math.max(...manaCurve, 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/decks" className="text-sm text-gray-500 hover:text-[#f0b232] transition-colors">
        ← 返回卡组库
      </Link>

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-xs font-bold tier-${deck.tier}`}>T{deck.tier}</span>
          <span className={`text-xs class-${deck.hero_class}`}>
            {CLASS_NAMES[deck.hero_class] || deck.hero_class}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#e8e6e3]">{deck.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{deck.title_en}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">胜率</div>
          <div className={`text-xl font-bold ${deck.win_rate >= 55 ? "win-rate-good" : deck.win_rate >= 50 ? "win-rate-ok" : "win-rate-bad"}`}>
            {deck.win_rate}%
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">合成费用</div>
          <div className="text-xl font-bold text-[#4fc3f7]">💎 {deck.dust_cost.toLocaleString()}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">强度</div>
          <div className={`text-xl font-bold tier-${deck.tier}`}>Tier {deck.tier}</div>
        </div>
      </div>

      {/* Deck Code */}
      <div className="card p-4 mb-8">
        <div className="flex items-center justify-between">
          <code className="text-xs text-gray-400 truncate flex-1 mr-4">
            {deck.deck_code}
          </code>
          <button
            onClick={copyDeckCode}
            className="px-4 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] transition-colors whitespace-nowrap"
          >
            {copied ? "已复制！" : "复制代码"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Mana Curve */}
        <div className="card p-5">
          <h3 className="font-semibold gold-text mb-4">费用曲线</h3>
          <div className="flex items-end gap-2 h-32">
            {manaCurve.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#4fc3f7] to-[#1a73e8] rounded-t"
                  style={{ height: `${(count / maxMana) * 100}%`, minHeight: count > 0 ? "8px" : "0" }}
                />
                <span className="text-xs text-gray-500 mt-1">{i === 7 ? "7+" : i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matchups */}
        <div className="card p-5">
          <h3 className="font-semibold gold-text mb-4">对阵胜率</h3>
          <div className="space-y-2">
            {Object.entries(deck.matchups || {}).map(([cls, wr]) => (
              <div key={cls} className="flex items-center gap-2 text-xs">
                <span className={`w-16 class-${cls}`}>{CLASS_NAMES[cls] || cls}</span>
                <div className="flex-1 h-2 bg-[#2a3040] rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${Number(wr) >= 55 ? "bg-green-500" : Number(wr) >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${wr}%` }}
                  />
                </div>
                <span className={`w-10 text-right ${Number(wr) >= 55 ? "win-rate-good" : Number(wr) >= 50 ? "win-rate-ok" : "win-rate-bad"}`}>
                  {wr}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card List */}
      <div className="card p-5 mb-8">
        <h3 className="font-semibold gold-text mb-4">卡牌列表</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {(deck.card_list || []).map((card, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#2a3040]">
              <span className="w-6 h-6 flex items-center justify-center rounded bg-[#4fc3f7]/20 text-[#4fc3f7] text-xs font-bold">
                {card.cost}
              </span>
              <span className="flex-1 text-sm text-gray-300">{card.name}</span>
              <span className="text-xs text-gray-500">×{card.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guide */}
      {deck.guide && (
        <div className="card p-6">
          <h3 className="font-semibold gold-text mb-4">使用攻略</h3>
          <MarkdownRenderer content={deck.guide} />
        </div>
      )}
    </div>
  );
}
