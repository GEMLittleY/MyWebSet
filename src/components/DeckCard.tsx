import Link from "next/link";
import type { Deck } from "@/lib/decks";

const CLASS_NAMES: Record<string, string> = {
  warrior: "战士", mage: "法师", hunter: "猎人", paladin: "圣骑士",
  priest: "牧师", rogue: "潜行者", shaman: "萨满", warlock: "术士",
  druid: "德鲁伊", "demon-hunter": "恶魔猎手", "death-knight": "死亡骑士",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  aggro: "快攻", midrange: "中速", control: "控制", combo: "组合技",
};

function getTierColor(tier: number) {
  if (tier === 1) return "tier-1";
  if (tier === 2) return "tier-2";
  if (tier === 3) return "tier-3";
  return "tier-4";
}

function getWinRateColor(wr: number) {
  if (wr >= 55) return "win-rate-good";
  if (wr >= 50) return "win-rate-ok";
  return "win-rate-bad";
}

export default function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Link href={`/decks/${deck.slug}`} className="card block p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#e8e6e3]">{deck.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{deck.title_en}</p>
        </div>
        <span className={`text-xs font-bold ${getTierColor(deck.tier)}`}>
          T{deck.tier}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className={`class-${deck.hero_class}`}>
          {CLASS_NAMES[deck.hero_class] || deck.hero_class}
        </span>
        <span className="text-gray-500">
          {ARCHETYPE_NAMES[deck.archetype] || deck.archetype}
        </span>
        <span className="text-gray-500">
          💎 {deck.dust_cost.toLocaleString()}
        </span>
        <span className={getWinRateColor(deck.win_rate)}>
          {deck.win_rate}%
        </span>
      </div>
    </Link>
  );
}
