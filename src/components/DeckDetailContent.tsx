"use client";

import { useState } from "react";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CardImage from "@/components/CardImage";
import type { Deck } from "@/lib/decks";

const CLASS_NAMES: Record<string, string> = {
  warrior: "战士", mage: "法师", hunter: "猎人", paladin: "圣骑士",
  priest: "牧师", rogue: "潜行者", shaman: "萨满", warlock: "术士",
  druid: "德鲁伊", "demon-hunter": "恶魔猎手", "death-knight": "死亡骑士",
};

const HERO_PORTRAITS: Record<string, string> = {
  warrior: "HERO_01", mage: "HERO_08", hunter: "HERO_05", paladin: "HERO_04",
  priest: "HERO_09", rogue: "HERO_03", shaman: "HERO_02", warlock: "HERO_07",
  druid: "HERO_06", "demon-hunter": "HERO_10", "death-knight": "HERO_11",
};

export default function DeckDetailContent({ deck }: { deck: Deck }) {
  const [copied, setCopied] = useState(false);

  const copyDeckCode = () => {
    navigator.clipboard.writeText(deck.deck_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const manaCurve: number[] = Array(8).fill(0);
  const manaCards: string[][] = Array.from({ length: 8 }, () => []);
  (deck.card_list || []).forEach((card) => {
    const idx = Math.min(card.cost, 7);
    manaCurve[idx] += card.count;
    for (let c = 0; c < card.count; c++) manaCards[idx].push(card.name);
  });
  const maxMana = Math.max(...manaCurve, 1);
  const totalCards = manaCurve.reduce((a, b) => a + b, 0);

  const heroPortrait = HERO_PORTRAITS[deck.hero_class];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/decks" className="text-sm text-gray-500 hover:text-[#f0b232] transition-colors">
        ← 返回卡组库
      </Link>

      {/* Hero Banner */}
      <div className="mt-6 mb-8 relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 z-0 opacity-20">
          {heroPortrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://art.hearthstonejson.com/v1/256x/${heroPortrait}.jpg`}
              alt=""
              className="w-full h-full object-cover blur-sm"
              loading="lazy"
            />
          )}
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#1a1f2e] via-[#1a1f2e]/90 to-transparent" />
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold tier-${deck.tier} bg-[#0f1419]/60 px-2 py-0.5 rounded`}>T{deck.tier}</span>
            <span className={`text-xs class-${deck.hero_class} bg-[#0f1419]/60 px-2 py-0.5 rounded`}>
              {CLASS_NAMES[deck.hero_class] || deck.hero_class}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#e8e6e3]">{deck.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{deck.title_en}</p>
        </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold gold-text">费用曲线</h3>
            <span className="text-xs text-gray-500">共 {totalCards} 张</span>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {manaCurve.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <span className={`text-xs font-bold mb-1 ${count > 0 ? "text-[#4fc3f7]" : "text-gray-600"}`}>
                  {count > 0 ? count : ""}
                </span>
                <div className="w-full relative" style={{ height: "100px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      count > 0
                        ? "bg-gradient-to-t from-[#1a73e8] to-[#4fc3f7]"
                        : "bg-[#2a3040]"
                    }`}
                    style={{
                      height: count > 0 ? `${Math.max((count / maxMana) * 100, 8)}%` : "4px",
                    }}
                  />
                </div>
                <div className="mt-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-[#1a73e8]/30 text-[#4fc3f7] text-xs font-bold">
                  {i === 7 ? "7+" : i}
                </div>
                {count > 0 && (
                  <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-40 w-max max-w-[160px]">
                    <div className="bg-[#0f1419] border border-[#2a3040] rounded-lg p-2 shadow-xl text-xs">
                      {manaCards[i].map((name, j) => (
                        <div key={j} className="text-gray-300 py-0.5">{name}</div>
                      ))}
                    </div>
                  </div>
                )}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold gold-text">卡牌列表</h3>
          <span className="text-xs text-gray-500">{totalCards} 张卡牌</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[...(deck.card_list || [])].sort((a, b) => a.cost - b.cost).map((card, i) => (
            <CardImage
              key={i}
              cardId={card.card_id}
              name={card.name}
              cost={card.cost}
              count={card.count}
            />
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
