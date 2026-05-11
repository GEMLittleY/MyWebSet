"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CARD_CLASSES,
  CARD_RARITIES,
  CARD_TYPES,
  type CardIndexEntry,
} from "@/lib/cards-meta";
import { useLanguage } from "./LanguageProvider";

const COST_BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7] as const; // 7+ means >= 7

const PAGE_SIZE = 48;

const CLASS_LABELS_EN: Record<string, string> = {
  DEATHKNIGHT: "Death Knight",
  DEMONHUNTER: "Demon Hunter",
  DRUID: "Druid",
  HUNTER: "Hunter",
  MAGE: "Mage",
  PALADIN: "Paladin",
  PRIEST: "Priest",
  ROGUE: "Rogue",
  SHAMAN: "Shaman",
  WARLOCK: "Warlock",
  WARRIOR: "Warrior",
  NEUTRAL: "Neutral",
};
const CLASS_LABELS_ZH: Record<string, string> = {
  DEATHKNIGHT: "死亡骑士",
  DEMONHUNTER: "恶魔猎手",
  DRUID: "德鲁伊",
  HUNTER: "猎人",
  MAGE: "法师",
  PALADIN: "圣骑士",
  PRIEST: "牧师",
  ROGUE: "潜行者",
  SHAMAN: "萨满",
  WARLOCK: "术士",
  WARRIOR: "战士",
  NEUTRAL: "中立",
};

const TYPE_LABELS_EN: Record<string, string> = {
  MINION: "Minion",
  SPELL: "Spell",
  WEAPON: "Weapon",
  LOCATION: "Location",
};
const TYPE_LABELS_ZH: Record<string, string> = {
  MINION: "随从",
  SPELL: "法术",
  WEAPON: "武器",
  LOCATION: "地标",
};

const RARITY_LABELS_EN: Record<string, string> = {
  FREE: "Free",
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};
const RARITY_LABELS_ZH: Record<string, string> = {
  FREE: "基本",
  COMMON: "普通",
  RARE: "稀有",
  EPIC: "史诗",
  LEGENDARY: "传说",
};

const RARITY_COLORS: Record<string, string> = {
  FREE: "text-gray-300",
  COMMON: "text-gray-300",
  RARE: "text-[#4fc3f7]",
  EPIC: "text-[#c084fc]",
  LEGENDARY: "text-[#f0b232]",
};

export default function CardsBrowser({
  cards,
  lang,
}: {
  cards: CardIndexEntry[];
  lang: "en" | "zh";
}) {
  const { localePath } = useLanguage();
  const [query, setQuery] = useState("");
  const [klass, setKlass] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [rarity, setRarity] = useState<string>("ALL");
  const [cost, setCost] = useState<number | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const t = lang === "zh"
    ? { search: "搜索卡片名…", all: "全部", reset: "重置", next: "下一页", prev: "上一页", noResult: "没有匹配的卡片", page: "页" }
    : { search: "Search cards…", all: "All", reset: "Reset", next: "Next", prev: "Prev", noResult: "No cards match your filters", page: "Page" };

  const classLabel = lang === "zh" ? CLASS_LABELS_ZH : CLASS_LABELS_EN;
  const typeLabel = lang === "zh" ? TYPE_LABELS_ZH : TYPE_LABELS_EN;
  const rarityLabel = lang === "zh" ? RARITY_LABELS_ZH : RARITY_LABELS_EN;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (klass !== "ALL") {
        const inClasses =
          c.cardClass === klass || (c.classes ?? []).includes(klass);
        if (!inClasses) return false;
      }
      if (type !== "ALL" && c.type !== type) return false;
      if (rarity !== "ALL" && c.rarity !== rarity) return false;
      if (cost !== "ALL") {
        const cc = c.cost ?? 0;
        if (cost === 7) {
          if (cc < 7) return false;
        } else if (cc !== cost) return false;
      }
      if (q) {
        const hay = `${c.name_en} ${c.name_zh}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, query, klass, type, rarity, cost]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const setAndResetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold gold-text mb-2">
          {lang === "zh" ? "卡片图鉴" : "Card Browser"}
        </h1>
        <p className="text-sm text-gray-500">
          {filtered.length.toLocaleString()} / {cards.length.toLocaleString()}
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t.search}
          className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-4 py-2 pl-9 text-sm text-[#e8e6e3] placeholder:text-gray-600 focus:outline-none focus:border-[#f0b232]"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Filter rows */}
      <FilterRow
        label={lang === "zh" ? "职业" : "Class"}
        items={[
          { id: "ALL", label: t.all },
          ...CARD_CLASSES.map((c) => ({ id: c, label: classLabel[c] })),
        ]}
        value={klass}
        onChange={setAndResetPage(setKlass)}
      />
      <FilterRow
        label={lang === "zh" ? "费用" : "Cost"}
        items={[
          { id: "ALL", label: t.all },
          ...COST_BUCKETS.map((n) => ({
            id: String(n),
            label: n === 7 ? "7+" : String(n),
          })),
        ]}
        value={cost === "ALL" ? "ALL" : String(cost)}
        onChange={(v) =>
          setAndResetPage(setCost)(v === "ALL" ? "ALL" : Number(v))
        }
      />
      <FilterRow
        label={lang === "zh" ? "类型" : "Type"}
        items={[
          { id: "ALL", label: t.all },
          ...CARD_TYPES.map((tp) => ({ id: tp, label: typeLabel[tp] })),
        ]}
        value={type}
        onChange={setAndResetPage(setType)}
      />
      <FilterRow
        label={lang === "zh" ? "稀有度" : "Rarity"}
        items={[
          { id: "ALL", label: t.all },
          ...CARD_RARITIES.map((r) => ({ id: r, label: rarityLabel[r] })),
        ]}
        value={rarity}
        onChange={setAndResetPage(setRarity)}
      />

      {/* Reset button */}
      {(klass !== "ALL" ||
        type !== "ALL" ||
        rarity !== "ALL" ||
        cost !== "ALL" ||
        query) && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setKlass("ALL");
              setType("ALL");
              setRarity("ALL");
              setCost("ALL");
              setPage(0);
            }}
            className="text-xs text-gray-400 hover:text-[#f0b232]"
          >
            ← {t.reset}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">{t.noResult}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {pageItems.map((c) => (
              <Link
                key={c.id}
                href={localePath(`/cards/${c.id}`)}
                prefetch={false}
                className="card group p-0 overflow-hidden hover:border-[#f0b232] block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://art.hearthstonejson.com/v1/render/latest/${lang === "zh" ? "zhCN" : "enUS"}/256x/${c.id}.png`}
                  alt={lang === "zh" ? c.name_zh : c.name_en}
                  loading="lazy"
                  className="w-full aspect-[2.5/3.5] object-contain bg-[#0f1419]"
                />
                <div className="px-2 py-1.5 border-t border-[#2a3040]">
                  <p className={`text-xs font-medium truncate ${RARITY_COLORS[c.rarity] ?? "text-gray-300"}`}>
                    {lang === "zh" ? c.name_zh : c.name_en}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {c.cost ?? 0} · {typeLabel[c.type] ?? c.type}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 text-sm">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-gray-300 disabled:opacity-40 hover:border-[#f0b232]"
              >
                ← {t.prev}
              </button>
              <span className="text-gray-500">
                {t.page} {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-gray-300 disabled:opacity-40 hover:border-[#f0b232]"
              >
                {t.next} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1 w-12 shrink-0">{label}</span>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin flex-wrap">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              value === item.id
                ? "bg-[#f0b232] text-[#0f1419]"
                : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
