"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CARD_CLASSES, type CardIndexEntry } from "@/lib/cards-meta";
import {
  CLASS_HEROES,
  FORMAT_STANDARD,
  FORMAT_WILD,
  encodeDeckstring,
} from "@/lib/deckstring-encoder";
import { useSession } from "@/lib/useSession";
import { createClient } from "@/lib/supabase-browser";
import { deckClassToCardClass } from "@/lib/cards-meta";
import {
  createDeck,
  deleteDeck,
  getMyDeckById,
  updateDeck,
  type UserDeck,
} from "@/lib/user-decks";

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
};

const RARITY_COLORS: Record<string, string> = {
  LEGENDARY: "text-[#f0b232]",
  EPIC: "text-[#c084fc]",
  RARE: "text-[#4fc3f7]",
  COMMON: "text-gray-300",
  FREE: "text-gray-300",
};

const PLAYABLE_CLASSES = CARD_CLASSES.filter((c) => c !== "NEUTRAL");

type Selected = Record<string, number>;

const STORAGE_KEY = "hg_builder_draft_v1";

type Draft = {
  klass: string;
  format: number;
  selected: Selected;
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export default function DeckBuilder({
  cards,
  lang,
}: {
  cards: CardIndexEntry[];
  lang: "en" | "zh";
}) {
  const classLabel = lang === "zh" ? CLASS_LABELS_ZH : CLASS_LABELS_EN;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const editingId = (() => {
    const v = searchParams?.get("id");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const forkFromSlug = searchParams?.get("from") ?? null;

  // Lazy initialisers read localStorage exactly once on the client; on the
  // server they return the safe defaults. The initial render matches the
  // server output (default values), and the hydration mismatch we accept here
  // is intentional: drafts only matter for the actual user, never crawlers.
  const [klass, setKlass] = useState<string>(
    () => readDraft()?.klass ?? PLAYABLE_CLASSES[0]!,
  );
  const [format, setFormat] = useState<number>(
    () => readDraft()?.format ?? FORMAT_STANDARD,
  );
  const [selected, setSelected] = useState<Selected>(
    () => readDraft()?.selected ?? {},
  );
  const [query, setQuery] = useState("");
  const [costFilter, setCostFilter] = useState<number | "ALL">("ALL");
  const [exported, setExported] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [savingDeck, setSavingDeck] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadedDeck, setLoadedDeck] = useState<UserDeck | null>(null);

  // Load existing user deck when ?id= is present and the user is signed in.
  useEffect(() => {
    if (!user || !editingId) return;
    const cancelled = { current: false };
    const supabase = createClient();
    getMyDeckById(supabase, user.id, editingId)
      .then((deck) => {
        if (cancelled.current || !deck) return;
        setLoadedDeck(deck);
        setTitle(deck.title);
        setIsPublic(deck.is_public);
        setKlass(deck.hero_class);
        const next: Selected = {};
        const dbfToId = new Map(cards.map((c) => [c.dbfId, c.id] as const));
        for (const entry of deck.card_list) {
          const id =
            typeof entry.card_id === "string"
              ? entry.card_id
              : dbfToId.get(entry.card_id) ?? "";
          if (id) next[id] = (next[id] ?? 0) + entry.count;
        }
        setSelected(next);
        setExported(deck.deck_code ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled.current) return;
        setSaveError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled.current = true;
    };
  }, [user, editingId, cards]);

  // Fork from a curated meta deck by slug. Best-effort: if the slug is bad
  // we silently skip (current selection wins).
  useEffect(() => {
    if (!forkFromSlug || editingId || loadedDeck) return;
    const cancelled = { current: false };
    const supabase = createClient();
    supabase
      .from("decks")
      .select("hero_class,title,title_en,card_list,deck_code")
      .eq("slug", forkFromSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled.current || !data) return;
        const meta = data as {
          hero_class: string;
          title: string;
          title_en: string | null;
          card_list: Array<{ card_id: string | number; count: number }>;
          deck_code: string | null;
        };
        setKlass(deckClassToCardClass(meta.hero_class));
        const next: Selected = {};
        const dbfToId = new Map(cards.map((c) => [c.dbfId, c.id] as const));
        for (const entry of meta.card_list ?? []) {
          const id =
            typeof entry.card_id === "string"
              ? entry.card_id
              : dbfToId.get(entry.card_id) ?? "";
          if (id) next[id] = (next[id] ?? 0) + entry.count;
        }
        setSelected(next);
        const forkLabel = lang === "zh" ? "我的" : "My ";
        setTitle(`${forkLabel}${meta.title_en || meta.title}`);
        setExported(meta.deck_code ?? null);
      });
    return () => {
      cancelled.current = true;
    };
  }, [forkFromSlug, editingId, loadedDeck, cards, lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ klass, format, selected }),
      );
    } catch {
      // quota — ignore
    }
  }, [klass, format, selected]);

  // Pool of pickable cards for current class
  const pool = useMemo(() => {
    return cards.filter((c) => {
      if (c.cardClass !== klass && c.cardClass !== "NEUTRAL") {
        if (!(c.classes ?? []).includes(klass)) return false;
      }
      return true;
    });
  }, [cards, klass]);

  const filteredPool = useMemo(() => {
    let list = pool;
    if (costFilter !== "ALL") {
      list = list.filter((c) => {
        const cc = c.cost ?? 0;
        if (costFilter === 7) return cc >= 7;
        return cc === costFilter;
      });
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        `${c.name_en} ${c.name_zh}`.toLowerCase().includes(q),
      );
    }
    // Sort: cost asc, then alphabetical
    return [...list].sort((a, b) => {
      if (a.cost !== b.cost) return (a.cost ?? 0) - (b.cost ?? 0);
      const an = lang === "zh" ? a.name_zh : a.name_en;
      const bn = lang === "zh" ? b.name_zh : b.name_en;
      return an.localeCompare(bn);
    });
  }, [pool, query, costFilter, lang]);

  const total = useMemo(
    () => Object.values(selected).reduce((a, b) => a + b, 0),
    [selected],
  );

  const selectedEntries = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.id, c] as const));
    return Object.entries(selected)
      .map(([id, count]) => ({ card: byId.get(id), count }))
      .filter((x): x is { card: CardIndexEntry; count: number } => !!x.card)
      .sort((a, b) => {
        if (a.card.cost !== b.card.cost)
          return (a.card.cost ?? 0) - (b.card.cost ?? 0);
        const an = lang === "zh" ? a.card.name_zh : a.card.name_en;
        const bn = lang === "zh" ? b.card.name_zh : b.card.name_en;
        return an.localeCompare(bn);
      });
  }, [selected, cards, lang]);

  const dust = useMemo(() => {
    const COST: Record<string, number> = {
      COMMON: 40,
      RARE: 100,
      EPIC: 400,
      LEGENDARY: 1600,
      FREE: 0,
    };
    return selectedEntries.reduce(
      (sum, { card, count }) => sum + (COST[card.rarity] ?? 0) * count,
      0,
    );
  }, [selectedEntries]);

  const addCard = (card: CardIndexEntry) => {
    setSelected((prev) => {
      const cur = prev[card.id] ?? 0;
      const max = card.rarity === "LEGENDARY" ? 1 : 2;
      if (cur >= max) return prev;
      if (total >= 30) return prev;
      return { ...prev, [card.id]: cur + 1 };
    });
  };
  const removeCard = (card: CardIndexEntry) => {
    setSelected((prev) => {
      const cur = prev[card.id] ?? 0;
      if (cur <= 0) return prev;
      const next = { ...prev };
      if (cur - 1 === 0) delete next[card.id];
      else next[card.id] = cur - 1;
      return next;
    });
  };

  const exportCode = () => {
    if (total !== 30) {
      setExported(null);
      return;
    }
    const heroDbf = CLASS_HEROES[klass];
    if (!heroDbf) return;
    const dbfById = new Map(cards.map((c) => [c.id, c.dbfId] as const));
    const cardList = Object.entries(selected)
      .map(([id, count]) => ({ dbfId: dbfById.get(id) ?? 0, count }))
      .filter((x) => x.dbfId > 0);
    const code = encodeDeckstring({
      format,
      heroes: [heroDbf],
      cards: cardList,
    });
    setExported(code);
  };

  const clearAll = () => {
    setSelected({});
    setExported(null);
  };

  // Snapshot the current builder state into a row payload for user_decks.
  const buildPayload = () => ({
    title: title.trim() || `${classLabel[klass]} ${new Date().toISOString().slice(0, 10)}`,
    description: null,
    hero_class: klass,
    archetype: null,
    deck_code: exported,
    card_list: Object.entries(selected).map(([id, count]) => ({
      card_id: id,
      count,
    })),
    dust_cost: dust,
    parent_slug: forkFromSlug,
    is_public: isPublic,
  });

  const saveDeck = async () => {
    if (!user) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : `/${lang}/builder`;
      router.push(`/${lang}/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (total === 0) return;
    setSavingDeck(true);
    setSaveError(null);
    const supabase = createClient();
    try {
      const payload = buildPayload();
      if (loadedDeck) {
        const updated = await updateDeck(supabase, loadedDeck.id, payload);
        setLoadedDeck(updated);
      } else {
        const created = await createDeck(supabase, user.id, payload);
        setLoadedDeck(created);
        // Move to ?id=N so subsequent saves update in place.
        router.replace(`/${lang}/builder?id=${created.id}`);
      }
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSavingDeck(false);
    }
  };

  const togglePublish = async () => {
    if (!user || !loadedDeck) return;
    setSavingDeck(true);
    setSaveError(null);
    const supabase = createClient();
    try {
      const updated = await updateDeck(supabase, loadedDeck.id, {
        is_public: !isPublic,
      });
      setLoadedDeck(updated);
      setIsPublic(updated.is_public);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "publish failed");
    } finally {
      setSavingDeck(false);
    }
  };

  const removeDeck = async () => {
    if (!user || !loadedDeck) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        lang === "zh"
          ? "确定要删除这套卡组吗？此操作不可撤销。"
          : "Delete this deck? This cannot be undone.",
      )
    ) {
      return;
    }
    setSavingDeck(true);
    setSaveError(null);
    const supabase = createClient();
    try {
      await deleteDeck(supabase, loadedDeck.id);
      router.replace(`/${lang}/account/decks`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "delete failed");
      setSavingDeck(false);
    }
  };

  const t = lang === "zh"
    ? {
        title: "卡组构筑器",
        search: "搜索卡片…",
        export: "导出卡组代码",
        clear: "清空",
        standard: "标准",
        wild: "狂野",
        cards: "张",
        noCards: "尚未加入任何卡牌，从左侧选择吧",
        copy: "复制",
        copied: "已复制",
        needMore: (n: number) => `还需 ${n} 张`,
        atCap: "已达 30 张",
        dust: "尘",
        saved: "已自动保存到本地",
        deckTitlePh: "给卡组起个名字…",
        save: "保存到我的卡组",
        update: "更新",
        savedAccount: "已保存",
        publish: "公开发布",
        unpublish: "设为私密",
        published: "公开",
        privateLabel: "私密",
        publicLink: "公开链接",
        delete: "删除",
        signInPrompt: "登录后即可保存到云端",
        forkedFrom: "源自",
      }
    : {
        title: "Deck Builder",
        search: "Search cards…",
        export: "Export deck code",
        clear: "Clear",
        standard: "Standard",
        wild: "Wild",
        cards: " ",
        noCards: "No cards yet — pick some from the left",
        copy: "Copy",
        copied: "Copied",
        needMore: (n: number) => `Pick ${n} more`,
        atCap: "30/30 ready",
        dust: "dust",
        saved: "Auto-saved locally",
        deckTitlePh: "Name your deck…",
        save: "Save to my decks",
        update: "Update",
        savedAccount: "Saved",
        publish: "Publish publicly",
        unpublish: "Make private",
        published: "Public",
        privateLabel: "Private",
        publicLink: "Public link",
        delete: "Delete",
        signInPrompt: "Sign in to save to your account",
        forkedFrom: "Forked from",
      };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold gold-text mb-2">
          {t.title}
        </h1>
        <p className="text-xs text-gray-500">{t.saved}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Browse */}
        <section className="min-w-0">
          {/* Class row */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-thin pb-2 flex-wrap">
            {PLAYABLE_CLASSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setKlass(c);
                  if (Object.keys(selected).length > 0 && c !== klass) {
                    setSelected({});
                    setExported(null);
                  }
                }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  klass === c
                    ? "bg-[#f0b232] text-[#0f1419]"
                    : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
                }`}
              >
                {classLabel[c]}
              </button>
            ))}
          </div>

          {/* Format + search */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="inline-flex rounded-lg bg-[#1a1f2e] border border-[#2a3040] p-1 text-xs">
              <button
                type="button"
                onClick={() => setFormat(FORMAT_STANDARD)}
                className={`px-3 py-1 rounded ${format === FORMAT_STANDARD ? "bg-[#4fc3f7] text-[#0f1419]" : "text-gray-400"}`}
              >
                {t.standard}
              </button>
              <button
                type="button"
                onClick={() => setFormat(FORMAT_WILD)}
                className={`px-3 py-1 rounded ${format === FORMAT_WILD ? "bg-[#4fc3f7] text-[#0f1419]" : "text-gray-400"}`}
              >
                {t.wild}
              </button>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-3 py-1.5 pl-8 text-xs text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Cost row */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {(["ALL", 0, 1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
              <button
                key={String(n)}
                type="button"
                onClick={() => setCostFilter(n)}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  costFilter === n
                    ? "bg-[#f0b232] text-[#0f1419]"
                    : "bg-[#1a1f2e] text-gray-400 hover:text-[#f0b232] border border-[#2a3040]"
                }`}
              >
                {n === "ALL" ? (lang === "zh" ? "全" : "All") : n === 7 ? "7+" : n}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPool.slice(0, 120).map((card) => {
              const count = selected[card.id] ?? 0;
              const max = card.rarity === "LEGENDARY" ? 1 : 2;
              const atMax = count >= max;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => addCard(card)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    removeCard(card);
                  }}
                  disabled={atMax || total >= 30}
                  className={`card group p-0 overflow-hidden text-left disabled:opacity-60 hover:border-[#f0b232] relative`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://art.hearthstonejson.com/v1/render/latest/${lang === "zh" ? "zhCN" : "enUS"}/256x/${card.id}.png`}
                    alt={lang === "zh" ? card.name_zh : card.name_en}
                    loading="lazy"
                    className="w-full aspect-[2.5/3.5] object-contain bg-[#0f1419]"
                  />
                  <div className="px-2 py-1 border-t border-[#2a3040] flex items-center justify-between">
                    <span className={`text-[11px] truncate ${RARITY_COLORS[card.rarity] ?? "text-gray-300"}`}>
                      {lang === "zh" ? card.name_zh : card.name_en}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] bg-[#f0b232] text-[#0f1419] rounded px-1.5 font-bold">
                        ×{count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filteredPool.length > 120 && (
            <p className="text-center text-xs text-gray-500 mt-4">
              {lang === "zh"
                ? `… 还有 ${filteredPool.length - 120} 张未显示，请细化筛选条件`
                : `… ${filteredPool.length - 120} more results, refine your filters`}
            </p>
          )}
        </section>

        {/* Deck panel */}
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold gold-text">
                {classLabel[klass]} · {total}/30
              </h2>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                {t.clear}
              </button>
            </div>
            <div className="h-1.5 bg-[#0f1419] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#4fc3f7] to-[#f0b232] transition-all"
                style={{ width: `${(total / 30) * 100}%` }}
              />
            </div>

            {total === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">
                {t.noCards}
              </p>
            ) : (
              <ul className="space-y-1 max-h-[40vh] overflow-y-auto scrollbar-thin -mx-2 px-2">
                {selectedEntries.map(({ card, count }) => (
                  <li
                    key={card.id}
                    className="flex items-center gap-2 group hover:bg-[#0f1419]/60 rounded px-1.5 py-1"
                  >
                    <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0f1419] text-[10px] text-gray-300">
                      {card.cost ?? 0}
                    </span>
                    <span
                      className={`flex-1 text-xs truncate ${RARITY_COLORS[card.rarity] ?? "text-gray-300"}`}
                    >
                      {lang === "zh" ? card.name_zh : card.name_en}
                    </span>
                    {count > 1 && (
                      <span className="text-[10px] text-gray-400">×{count}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCard(card)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-1"
                      aria-label="remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 pt-3 border-t border-[#2a3040] text-xs text-gray-500 flex justify-between">
              <span>💎 {dust.toLocaleString()} {t.dust}</span>
              <span>{total < 30 ? t.needMore(30 - total) : t.atCap}</span>
            </div>

            <button
              type="button"
              onClick={exportCode}
              disabled={total !== 30}
              className="mt-3 w-full py-2 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold disabled:opacity-50 hover:bg-[#d4982a] transition-colors text-sm"
            >
              {t.export}
            </button>

            {exported && (
              <div className="mt-3">
                <textarea
                  readOnly
                  value={exported}
                  className="w-full text-[10px] bg-[#0f1419] border border-[#2a3040] rounded p-2 text-gray-300 font-mono h-20 resize-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(exported);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full py-1.5 rounded bg-[#1a1f2e] border border-[#2a3040] text-xs text-gray-300 hover:border-[#4fc3f7]"
                >
                  {t.copy}
                </button>
              </div>
            )}

            {/* Save to account */}
            <div className="mt-4 pt-4 border-t border-[#2a3040]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder={t.deckTitlePh}
                className="w-full px-3 py-2 mb-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-xs text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
              />
              {forkFromSlug && !loadedDeck && (
                <p className="text-[10px] text-gray-500 mb-2">
                  {t.forkedFrom}{" "}
                  <Link
                    href={`/${lang}/decks/${forkFromSlug}`}
                    className="text-[#4fc3f7] hover:underline"
                  >
                    {forkFromSlug}
                  </Link>
                </p>
              )}
              <button
                type="button"
                onClick={saveDeck}
                disabled={savingDeck || total === 0}
                className="w-full py-2 rounded-lg bg-[#4fc3f7] text-[#0f1419] font-semibold disabled:opacity-50 hover:bg-[#3aa8d8] transition-colors text-sm"
              >
                {savingDeck
                  ? "…"
                  : loadedDeck
                    ? t.update
                    : user
                      ? t.save
                      : t.signInPrompt}
              </button>

              {savedAt && !savingDeck && (
                <p className="mt-1 text-[10px] text-emerald-400 text-center">
                  {t.savedAccount}
                </p>
              )}
              {saveError && (
                <p className="mt-1 text-[10px] text-red-400 text-center">
                  {saveError}
                </p>
              )}

              {loadedDeck && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                    <span>
                      {isPublic ? t.published : t.privateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={togglePublish}
                      disabled={savingDeck}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        isPublic
                          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-[#1a1f2e] text-gray-300 hover:text-[#f0b232] border border-[#2a3040]"
                      }`}
                    >
                      {isPublic ? t.unpublish : t.publish}
                    </button>
                  </div>
                  {isPublic && (
                    <Link
                      href={`/${lang}/u/decks/${loadedDeck.id}`}
                      target="_blank"
                      className="block text-center text-[11px] text-[#4fc3f7] hover:underline"
                    >
                      {t.publicLink} →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={removeDeck}
                    disabled={savingDeck}
                    className="w-full text-[11px] text-red-400 hover:text-red-300 py-1"
                  >
                    {t.delete}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
