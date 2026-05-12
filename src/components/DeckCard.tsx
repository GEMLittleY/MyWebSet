"use client";

import Link from "next/link";
import type { Deck } from "@/lib/decks";
import { useLanguage } from "./LanguageProvider";
import FavoriteButton from "./FavoriteButton";

const CLASS_NAMES: Record<string, string> = {
  warrior: "战士", mage: "法师", hunter: "猎人", paladin: "圣骑士",
  priest: "牧师", rogue: "潜行者", shaman: "萨满", warlock: "术士",
  druid: "德鲁伊", "demon-hunter": "恶魔猎手", "death-knight": "死亡骑士",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  aggro: "快攻", midrange: "中速", control: "控制", combo: "组合技",
};

const CLASS_GRADIENTS: Record<string, string> = {
  warrior: "from-[#c41e3a]/20 to-transparent",
  mage: "from-[#3fc7eb]/20 to-transparent",
  hunter: "from-[#aad372]/20 to-transparent",
  paladin: "from-[#f48cba]/20 to-transparent",
  priest: "from-[#ffffff]/15 to-transparent",
  rogue: "from-[#fff468]/15 to-transparent",
  shaman: "from-[#0070dd]/20 to-transparent",
  warlock: "from-[#8788ee]/20 to-transparent",
  druid: "from-[#ff7c0a]/20 to-transparent",
  "demon-hunter": "from-[#a330c9]/20 to-transparent",
  "death-knight": "from-[#c41e3a]/20 to-transparent",
};

const HERO_PORTRAITS: Record<string, string> = {
  warrior: "HERO_01", mage: "HERO_08", hunter: "HERO_05", paladin: "HERO_04",
  priest: "HERO_09", rogue: "HERO_03", shaman: "HERO_02", warlock: "HERO_07",
  druid: "HERO_06", "demon-hunter": "HERO_10", "death-knight": "HERO_11",
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
  const { lang, t, localePath } = useLanguage();
  const heroId = HERO_PORTRAITS[deck.hero_class];
  const gradient = CLASS_GRADIENTS[deck.hero_class] || "from-transparent to-transparent";
  const className = lang === "zh"
    ? CLASS_NAMES[deck.hero_class] ?? deck.hero_class
    : (t.classes as Record<string, string>)[deck.hero_class] ?? deck.hero_class;
  const archetypeName = lang === "zh"
    ? ARCHETYPE_NAMES[deck.archetype] ?? deck.archetype
    : (t.archetypes as Record<string, string>)[deck.archetype] ?? deck.archetype;
  const title = lang === "zh" ? deck.title : deck.title_en || deck.title;
  const subtitle = lang === "zh" ? deck.title_en : deck.title;

  return (
    <Link href={localePath(`/decks/${deck.slug}`)} className="card block relative overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton type="deck" id={deck.slug} variant="icon-only" />
      </div>
      {heroId && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://art.hearthstonejson.com/v1/256x/${heroId}.jpg`}
            alt=""
            className="absolute right-0 top-0 w-24 h-full object-cover opacity-15"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#1a1f2e]/80 to-[#1a1f2e]" />
        </>
      )}

      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />

      <div className="relative p-5 pr-12">
        <div className="mb-3">
          <h3 className="font-semibold text-[#e8e6e3]">{title}</h3>
          {subtitle && subtitle !== title && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`text-xs font-bold ${getTierColor(deck.tier)} bg-[#0f1419]/60 px-1.5 py-0.5 rounded`}>
            T{deck.tier}
          </span>
          <span className={`class-${deck.hero_class}`}>{className}</span>
          <span className="text-gray-500">{archetypeName}</span>
          <span className="text-gray-500">
            💎 {deck.dust_cost.toLocaleString()}
          </span>
          <span className={getWinRateColor(deck.win_rate)}>
            {deck.win_rate}%
          </span>
        </div>
      </div>
    </Link>
  );
}
