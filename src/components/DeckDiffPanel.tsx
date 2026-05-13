"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useSession } from "@/lib/useSession";
import {
  computeDiff,
  type DeckCard,
  type DiffResult,
} from "@/lib/collection-diff";
import { useLanguage } from "./LanguageProvider";

const RARITY_BORDER: Record<string, string> = {
  COMMON: "border-gray-500/40",
  RARE: "border-[#4fc3f7]/40",
  EPIC: "border-[#c084fc]/40",
  LEGENDARY: "border-[#f0b232]/60",
  FREE: "border-gray-500/40",
};

const RARITY_TEXT: Record<string, string> = {
  COMMON: "text-gray-300",
  RARE: "text-[#4fc3f7]",
  EPIC: "text-[#c084fc]",
  LEGENDARY: "text-[#f0b232]",
  FREE: "text-gray-300",
};

export default function DeckDiffPanel({
  enrichedCards,
}: {
  enrichedCards: DeckCard[];
}) {
  const { lang, localePath } = useLanguage();
  const { user, loading: sessionLoading } = useSession();
  const [owned, setOwned] = useState<Map<number, number>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const cancelled = { current: false };
    if (sessionLoading) return;
    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled.current) {
          setOwned(new Map());
          setLoaded(true);
        }
      });
      return () => {
        cancelled.current = true;
      };
    }
    const supabase = createClient();
    const dbfIds = enrichedCards.map((c) => c.card_dbf_id);
    if (dbfIds.length === 0) {
      Promise.resolve().then(() => {
        if (!cancelled.current) setLoaded(true);
      });
      return () => {
        cancelled.current = true;
      };
    }
    supabase
      .from("user_collection")
      .select("card_dbf_id,count")
      .eq("user_id", user.id)
      .in("card_dbf_id", dbfIds)
      .then(({ data }) => {
        if (cancelled.current) return;
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
  }, [user, sessionLoading, enrichedCards]);

  const diff: DiffResult = useMemo(
    () => computeDiff(enrichedCards, owned),
    [enrichedCards, owned],
  );

  const t =
    lang === "zh"
      ? {
          title: "我的造价",
          subSignedIn: "对比你的收藏，看看还需要多少尘",
          subAnon: "登录后即可对照你的收藏自动计算造价",
          signIn: "登录",
          setup: "管理我的收藏 →",
          missingHeading: "缺少的卡牌",
          ownedHeading: "已拥有",
          allOwned: "好消息：你已经拥有这套卡组的全部卡牌！",
          empty: "你还没有录入任何卡牌。",
          showMore: "展开缺卡列表",
          hideMore: "收起",
          dust: "尘",
          have: "已有",
          need: "总需",
        }
      : {
          title: "Crafting cost for you",
          subSignedIn: "Compares against your collection",
          subAnon: "Sign in to compute the dust you actually need",
          signIn: "Sign in",
          setup: "Manage collection →",
          missingHeading: "Missing cards",
          ownedHeading: "Already owned",
          allOwned: "Good news — you already own every card in this deck!",
          empty: "Your collection is empty.",
          showMore: "Show missing list",
          hideMore: "Hide",
          dust: "dust",
          have: "have",
          need: "need",
        };

  // Anonymous: invite to sign in.
  if (!sessionLoading && !user) {
    return (
      <div className="card p-4 sm:p-5 mb-6 sm:mb-8">
        <div className="flex items-start gap-3">
          <div className="text-3xl" aria-hidden>💰</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold gold-text mb-1">{t.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{t.subAnon}</p>
            <Link
              href={`/${lang}/login?next=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : `/${lang}`}`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-xs font-medium hover:bg-[#d4982a]"
            >
              {t.signIn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return null;
  }

  const missing = diff.rows.filter((r) => r.missing > 0);
  const collectionEmpty = owned.size === 0;

  return (
    <div className="card p-4 sm:p-5 mb-6 sm:mb-8">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold gold-text">{t.title}</h3>
          <p className="text-xs text-gray-500">{t.subSignedIn}</p>
        </div>
        <Link
          href={localePath("/account/collection")}
          className="text-xs text-[#4fc3f7] hover:underline whitespace-nowrap"
        >
          {t.setup}
        </Link>
      </div>

      {/* Big numbers row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat
          label={lang === "zh" ? "需要打造" : "To craft"}
          value={diff.totalMissing}
          accent="text-[#f0b232]"
        />
        <Stat
          label={lang === "zh" ? "需要尘" : "Dust needed"}
          value={diff.totalDust.toLocaleString()}
          accent="text-[#f0b232]"
        />
        <Stat
          label={lang === "zh" ? "已拥有" : "Already own"}
          value={`${diff.totalOwned}/${diff.totalNeeded}`}
          accent="text-emerald-400"
        />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#0f1419] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-[#4fc3f7] to-[#f0b232] transition-all"
          style={{
            width: `${diff.totalNeeded > 0 ? (diff.totalOwned / diff.totalNeeded) * 100 : 0}%`,
          }}
        />
      </div>

      {collectionEmpty ? (
        <p className="text-xs text-gray-500">
          {t.empty}{" "}
          <Link
            href={localePath("/account/collection")}
            className="text-[#4fc3f7] hover:underline"
          >
            {t.setup}
          </Link>
        </p>
      ) : diff.totalMissing === 0 ? (
        <p className="text-xs text-emerald-300">{t.allOwned}</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-xs text-gray-400 hover:text-[#f0b232]"
          >
            {collapsed ? `▸ ${t.showMore} (${missing.length})` : `▾ ${t.hideMore}`}
          </button>
          {!collapsed && (
            <ul className="mt-2 space-y-1">
              {missing.map((row) => (
                <li
                  key={row.card_dbf_id}
                  className={`flex items-center gap-2 rounded px-2 py-1 border-l-2 ${RARITY_BORDER[row.rarity] ?? RARITY_BORDER.COMMON}`}
                >
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0f1419] text-[10px] text-gray-300">
                    {row.cost}
                  </span>
                  <Link
                    href={localePath(`/cards/${row.card_id}`)}
                    className={`flex-1 text-xs truncate ${RARITY_TEXT[row.rarity] ?? "text-gray-300"} hover:underline`}
                  >
                    {lang === "zh" ? row.name_zh : row.name_en}
                  </Link>
                  <span className="text-[10px] text-gray-500">
                    {t.have} {row.owned}/{row.count}
                  </span>
                  <span className="text-[10px] font-medium text-[#f0b232]">
                    💎 {row.dust}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-[#0f1419] p-2.5 text-center">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-lg font-semibold ${accent ?? "text-[#e8e6e3]"}`}>
        {value}
      </p>
    </div>
  );
}
