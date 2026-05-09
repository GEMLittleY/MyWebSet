"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";

const TIER_LABELS_ZH: Record<number, string> = {
  1: "最强", 2: "强势", 3: "可用", 4: "弱势",
};
const TIER_LABELS_EN: Record<number, string> = {
  1: "Best", 2: "Strong", 3: "Viable", 4: "Weak",
};

export default function MetaContent({ decks }: { decks: Deck[] }) {
  const { t, lang } = useLanguage();

  const tierGroups: Record<number, Deck[]> = {};
  decks.forEach((d) => {
    if (!tierGroups[d.tier]) tierGroups[d.tier] = [];
    tierGroups[d.tier].push(d);
  });

  const classPower: Record<string, { count: number; avgWr: number }> = {};
  decks.forEach((d) => {
    if (!classPower[d.hero_class]) classPower[d.hero_class] = { count: 0, avgWr: 0 };
    classPower[d.hero_class].count++;
    classPower[d.hero_class].avgWr += d.win_rate;
  });
  Object.values(classPower).forEach((v) => {
    v.avgWr = Number((v.avgWr / v.count).toFixed(1));
  });

  const sortedClasses = Object.entries(classPower).sort((a, b) => b[1].avgWr - a[1].avgWr);
  const tierLabels = lang === "en" ? TIER_LABELS_EN : TIER_LABELS_ZH;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">{t.meta.title}</h1>
      <p className="text-gray-500 mb-10">{t.meta.desc}</p>

      {/* Class Power Rankings */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold gold-text mb-4">
          {lang === "en" ? "Class Power Rankings" : "职业强度排名"}
        </h2>
        <div className="card p-5">
          <div className="space-y-3">
            {sortedClasses.map(([cls, data], idx) => (
              <div key={cls} className="flex items-center gap-3">
                <span className="w-5 text-xs text-gray-500 text-right">{idx + 1}</span>
                <span className={`w-20 text-sm class-${cls}`}>
                  {(t.classes as Record<string, string>)[cls] || cls}
                </span>
                <div className="flex-1 h-3 bg-[#2a3040] rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#f0b232] to-[#ff6b35]"
                    style={{ width: `${(data.avgWr / 60) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 w-14 text-right">
                  {data.avgWr}%
                </span>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {data.count} {lang === "en" ? "decks" : "套卡组"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier List */}
      <section>
        <h2 className="text-xl font-semibold gold-text mb-4">{t.meta.tierList}</h2>
        {[1, 2, 3, 4].map((tier) => {
          const tierDecks = tierGroups[tier];
          if (!tierDecks || tierDecks.length === 0) return null;
          return (
            <div key={tier} className="mb-6">
              <h3 className={`text-sm font-bold mb-3 tier-${tier}`}>
                Tier {tier} — {tierLabels[tier]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tierDecks.map((deck) => (
                  <Link
                    key={deck.id}
                    href={`/decks/${deck.slug}`}
                    className="card p-4 flex items-center justify-between hover:border-[#f0b232]"
                  >
                    <div>
                      <span className={`text-sm class-${deck.hero_class}`}>
                        {(t.classes as Record<string, string>)[deck.hero_class] || deck.hero_class}
                      </span>
                      <span className="text-sm text-gray-300 ml-2">{deck.title}</span>
                    </div>
                    <span className={`text-sm font-medium ${deck.win_rate >= 55 ? "win-rate-good" : deck.win_rate >= 50 ? "win-rate-ok" : "win-rate-bad"}`}>
                      {deck.win_rate}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
