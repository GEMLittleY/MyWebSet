"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useSession } from "@/lib/useSession";
import { Events, track } from "@/lib/analytics";
import type { CardIndexEntry } from "@/lib/cards-meta";
import { CARD_CLASSES } from "@/lib/cards-meta";

type Lang = "en" | "zh";

const CLASS_LABELS_EN: Record<string, string> = {
  DEATHKNIGHT: "Death Knight",
  DEMONHUNTER: "Demon Hunter",
  DRUID: "Druid",
  HUNTER: "Hunter",
  MAGE: "Mage",
  NEUTRAL: "Neutral",
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
  NEUTRAL: "中立",
  PALADIN: "圣骑士",
  PRIEST: "牧师",
  ROGUE: "潜行者",
  SHAMAN: "萨满",
  WARLOCK: "术士",
  WARRIOR: "战士",
};

const RARITY_TEXT: Record<string, string> = {
  COMMON: "text-gray-300",
  RARE: "text-[#4fc3f7]",
  EPIC: "text-[#c084fc]",
  LEGENDARY: "text-[#f0b232]",
  FREE: "text-gray-300",
};

const PAGE_SIZE = 60;

export default function CollectionEditor({
  cards,
  lang,
}: {
  cards: CardIndexEntry[];
  lang: Lang;
}) {
  const { user, loading: sessionLoading } = useSession();
  const classLabel = lang === "zh" ? CLASS_LABELS_ZH : CLASS_LABELS_EN;
  const [owned, setOwned] = useState<Map<number, number>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [klass, setKlass] = useState<string | "ALL">("ALL");
  const [filter, setFilter] = useState<"all" | "missing" | "owned">("all");
  const [page, setPage] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t =
    lang === "zh"
      ? {
          title: "我的收藏",
          subtitle: "记录你拥有的卡牌，造价工具会自动算出真正需要的尘。",
          notSignedIn: "登录后即可同步你的收藏到云端。",
          signIn: "登录",
          loading: "加载中…",
          back: "← 返回账户",
          search: "搜索卡牌…",
          allClasses: "全部职业",
          show: "显示",
          showAll: "全部",
          showOwned: "已拥有",
          showMissing: "未拥有",
          importPaste: "用炉石卡组代码批量标记为已拥有",
          importPh: "粘贴卡组代码（AAEC...）",
          importBtn: "批量录入",
          importing: "处理中…",
          importDone: (n: number) => `已更新 ${n} 张卡牌`,
          page: "页",
          of: "/",
          prev: "上一页",
          next: "下一页",
          ownedShort: "拥有",
          legendary: "传说",
          empty: "没有匹配的卡牌",
          rarityCommon: "白",
          rarityRare: "蓝",
          rarityEpic: "紫",
          rarityLegendary: "橙",
          rarityFree: "免费",
        }
      : {
          title: "My collection",
          subtitle:
            "Tell us which cards you own; the crafting tool will compute the real dust cost for every deck.",
          notSignedIn: "Sign in to sync your collection across devices.",
          signIn: "Sign in",
          loading: "Loading…",
          back: "← Back to account",
          search: "Search cards…",
          allClasses: "All classes",
          show: "Show",
          showAll: "All",
          showOwned: "Owned",
          showMissing: "Missing",
          importPaste: "Bulk import: paste a deck code and mark its cards owned",
          importPh: "Paste a Hearthstone deck code (AAEC...)",
          importBtn: "Mark as owned",
          importing: "Importing…",
          importDone: (n: number) => `Updated ${n} cards`,
          page: "Page",
          of: "/",
          prev: "Prev",
          next: "Next",
          ownedShort: "Own",
          legendary: "Legendary",
          empty: "No cards match the current filters",
          rarityCommon: "C",
          rarityRare: "R",
          rarityEpic: "E",
          rarityLegendary: "L",
          rarityFree: "F",
        };

  // Initial fetch.
  useEffect(() => {
    const cancelled = { current: false };
    if (sessionLoading) return;
    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled.current) setLoaded(true);
      });
      return () => {
        cancelled.current = true;
      };
    }
    const supabase = createClient();
    supabase
      .from("user_collection")
      .select("card_dbf_id,count")
      .eq("user_id", user.id)
      .then(({ data, error: e }) => {
        if (cancelled.current) return;
        if (e) {
          setError(e.message);
          setLoaded(true);
          return;
        }
        const map = new Map<number, number>();
        for (const row of (data ?? []) as Array<{
          card_dbf_id: number;
          count: number;
        }>) {
          map.set(row.card_dbf_id, row.count);
        }
        setOwned(map);
        setLoaded(true);
      });
    return () => {
      cancelled.current = true;
    };
  }, [user, sessionLoading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (klass !== "ALL") {
        if (c.cardClass !== klass) {
          if (!(c.classes ?? []).includes(klass)) return false;
        }
      }
      if (q) {
        const hay = `${c.name_en} ${c.name_zh}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === "owned" && !owned.has(c.dbfId)) return false;
      if (filter === "missing" && owned.has(c.dbfId)) return false;
      return true;
    });
  }, [cards, query, klass, filter, owned]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // If the page index falls out of range (filters narrowed), clamp it
  // immediately without setState (avoid effect-loops).
  const safePage = page >= pageCount ? 0 : page;
  const visible = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage],
  );

  const setCount = async (card: CardIndexEntry, value: number) => {
    if (!user) return;
    const next = Math.max(0, Math.min(card.rarity === "LEGENDARY" ? 1 : 2, value));
    setSavingIds((prev) => new Set(prev).add(card.dbfId));
    const supabase = createClient();
    try {
      if (next === 0) {
        await supabase
          .from("user_collection")
          .delete()
          .eq("user_id", user.id)
          .eq("card_dbf_id", card.dbfId);
        setOwned((prev) => {
          const m = new Map(prev);
          m.delete(card.dbfId);
          return m;
        });
      } else {
        await supabase.from("user_collection").upsert(
          {
            user_id: user.id,
            card_dbf_id: card.dbfId,
            count: next,
          },
          { onConflict: "user_id,card_dbf_id" },
        );
        setOwned((prev) => {
          const m = new Map(prev);
          m.set(card.dbfId, next);
          return m;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSavingIds((prev) => {
        const n = new Set(prev);
        n.delete(card.dbfId);
        return n;
      });
    }
  };

  const importDeckCode = async (raw: string) => {
    if (!user) return;
    const code = raw.trim();
    if (!code) return;
    setImportBusy(true);
    setImportNote(null);
    setError(null);
    try {
      // Use the deckstring decoder server-side via /api/builder/decode-deckstring
      // (it already exists for the recommend page). Fallback: decode locally
      // via the same library used by Builder if route is missing.
      const res = await fetch("/api/collection/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "decode failed");
      }
      const data: { cards: Array<{ dbfId: number; count: number; rarity?: string }> } =
        await res.json();
      const supabase = createClient();
      const rowsToWrite = data.cards.map((c) => ({
        user_id: user.id,
        card_dbf_id: c.dbfId,
        count: Math.min(
          c.rarity === "LEGENDARY" ? 1 : 2,
          (owned.get(c.dbfId) ?? 0) + c.count,
        ),
      }));
      if (rowsToWrite.length > 0) {
        await supabase
          .from("user_collection")
          .upsert(rowsToWrite, { onConflict: "user_id,card_dbf_id" });
      }
      // Refresh local state.
      setOwned((prev) => {
        const m = new Map(prev);
        for (const r of rowsToWrite) m.set(r.card_dbf_id, r.count);
        return m;
      });
      track(Events.CollectionImport, { added: rowsToWrite.length });
      setImportNote(t.importDone(rowsToWrite.length));
    } catch (e) {
      setError(e instanceof Error ? e.message : "import failed");
    } finally {
      setImportBusy(false);
    }
  };

  if (sessionLoading || !loaded) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-2">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-3">{t.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{t.notSignedIn}</p>
        <Link
          href={`/${lang}/login?next=/${lang}/account/collection`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  const totalOwnedCopies = Array.from(owned.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold gold-text">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1 mb-2">{t.subtitle}</p>
        <p className="text-xs text-gray-500">
          <Link href={`/${lang}/account`} className="hover:text-[#f0b232]">
            {t.back}
          </Link>
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm p-3">
          {error}
        </div>
      )}

      <section className="card p-4 mb-6">
        <p className="text-xs text-gray-400 mb-2">{t.importPaste}</p>
        <form
          className="flex gap-2 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const code = String(fd.get("code") ?? "");
            importDeckCode(code);
          }}
        >
          <input
            name="code"
            type="text"
            placeholder={t.importPh}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-xs text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
          />
          <button
            type="submit"
            disabled={importBusy}
            className="px-4 py-2 rounded-lg bg-[#4fc3f7] text-[#0f1419] text-xs font-medium hover:bg-[#3aa8d8] disabled:opacity-50"
          >
            {importBusy ? t.importing : t.importBtn}
          </button>
        </form>
        {importNote && (
          <p className="mt-2 text-xs text-emerald-400">{importNote}</p>
        )}
      </section>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setPage(0);
            setQuery(e.target.value);
          }}
          placeholder={t.search}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-xs text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
        />
        <select
          value={klass}
          onChange={(e) => {
            setPage(0);
            setKlass(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-xs text-[#e8e6e3]"
        >
          <option value="ALL">{t.allClasses}</option>
          {CARD_CLASSES.map((c) => (
            <option key={c} value={c}>
              {classLabel[c]}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-lg bg-[#1a1f2e] border border-[#2a3040] p-1 text-xs">
          {(["all", "owned", "missing"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setPage(0);
                setFilter(f);
              }}
              className={`px-3 py-1 rounded ${filter === f ? "bg-[#f0b232] text-[#0f1419]" : "text-gray-400"}`}
            >
              {f === "all" ? t.showAll : f === "owned" ? t.showOwned : t.showMissing}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {t.ownedShort} {totalOwnedCopies}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">{t.empty}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visible.map((c) => {
            const max = c.rarity === "LEGENDARY" ? 1 : 2;
            const cur = owned.get(c.dbfId) ?? 0;
            const saving = savingIds.has(c.dbfId);
            return (
              <li
                key={c.dbfId}
                className="card px-3 py-2 flex items-center gap-3"
              >
                <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0f1419] text-[10px] text-gray-300">
                  {c.cost ?? 0}
                </span>
                <span
                  className={`flex-1 min-w-0 text-xs truncate ${RARITY_TEXT[c.rarity] ?? "text-gray-300"}`}
                >
                  {lang === "zh" ? c.name_zh : c.name_en}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: max + 1 }).map((_, n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(c, n)}
                      disabled={saving}
                      className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
                        cur === n
                          ? "bg-[#f0b232] text-[#0f1419]"
                          : "bg-[#0f1419] border border-[#2a3040] text-gray-500 hover:text-[#f0b232]"
                      } disabled:opacity-50`}
                      aria-label={`set ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="px-3 py-1 rounded bg-[#1a1f2e] border border-[#2a3040] text-gray-300 hover:border-[#f0b232] disabled:opacity-40"
          >
            ← {t.prev}
          </button>
          <span className="text-gray-500">
            {t.page} {safePage + 1} {t.of} {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            className="px-3 py-1 rounded bg-[#1a1f2e] border border-[#2a3040] text-gray-300 hover:border-[#f0b232] disabled:opacity-40"
          >
            {t.next} →
          </button>
        </div>
      )}
    </div>
  );
}
