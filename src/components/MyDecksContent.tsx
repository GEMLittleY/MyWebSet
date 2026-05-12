"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useSession } from "@/lib/useSession";
import { listMyDecks, deleteDeck, type UserDeck } from "@/lib/user-decks";

type Lang = "en" | "zh";

export default function MyDecksContent({ lang }: { lang: Lang }) {
  const { user, loading: sessionLoading } = useSession();
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t =
    lang === "zh"
      ? {
          title: "我的卡组",
          loading: "加载中…",
          notSignedIn: "登录后可保存并管理你的卡组。",
          signIn: "登录",
          back: "← 返回账户",
          newDeck: "新建卡组",
          empty: "你还没有创建任何卡组。",
          openBuilder: "打开构筑器",
          edit: "编辑",
          published: "公开",
          privateLabel: "私密",
          delete: "删除",
          confirmDelete: "确定要删除这套卡组吗？此操作不可撤销。",
          updated: "更新于",
          dust: "尘",
        }
      : {
          title: "My decks",
          loading: "Loading…",
          notSignedIn: "Sign in to save and manage your decks.",
          signIn: "Sign in",
          back: "← Back to account",
          newDeck: "New deck",
          empty: "You haven't built any decks yet.",
          openBuilder: "Open builder",
          edit: "Edit",
          published: "Public",
          privateLabel: "Private",
          delete: "Delete",
          confirmDelete: "Delete this deck? This cannot be undone.",
          updated: "Updated",
          dust: "dust",
        };

  useEffect(() => {
    if (sessionLoading) return;
    const cancelled = { current: false };
    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled.current) setLoaded(true);
      });
      return () => {
        cancelled.current = true;
      };
    }
    const supabase = createClient();
    listMyDecks(supabase, user.id)
      .then((rows) => {
        if (cancelled.current) return;
        setDecks(rows);
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (cancelled.current) return;
        setError(e instanceof Error ? e.message : "load failed");
        setLoaded(true);
      });
    return () => {
      cancelled.current = true;
    };
  }, [sessionLoading, user]);

  const onDelete = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm(t.confirmDelete)) return;
    const supabase = createClient();
    try {
      await deleteDeck(supabase, id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
    }
  };

  if (sessionLoading || !loaded) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-6">{t.title}</h1>
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
          href={`/${lang}/login?next=/${lang}/account/decks`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gold-text">{t.title}</h1>
        <Link
          href={`/${lang}/builder`}
          className="px-4 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.newDeck}
        </Link>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        <Link href={`/${lang}/account`} className="hover:text-[#f0b232]">
          {t.back}
        </Link>
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm p-3">
          {error}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-400 mb-4">{t.empty}</p>
          <Link
            href={`/${lang}/builder`}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#4fc3f7] text-[#0f1419] text-sm font-medium hover:bg-[#3aa8d8]"
          >
            {t.openBuilder}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {decks.map((d) => (
            <li key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#e8e6e3] truncate">
                    {d.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {d.hero_class.toLowerCase()} · 💎{" "}
                    {d.dust_cost.toLocaleString()} {t.dust} ·{" "}
                    <span
                      className={
                        d.is_public ? "text-emerald-400" : "text-gray-500"
                      }
                    >
                      {d.is_public ? t.published : t.privateLabel}
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {t.updated}{" "}
                    {new Date(d.updated_at).toLocaleString(
                      lang === "zh" ? "zh-CN" : "en-US",
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Link
                    href={`/${lang}/builder?id=${d.id}`}
                    className="text-xs text-[#4fc3f7] hover:underline"
                  >
                    {t.edit} →
                  </Link>
                  {d.is_public && (
                    <Link
                      href={`/${lang}/u/decks/${d.id}`}
                      target="_blank"
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      {t.published} →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
