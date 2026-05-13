"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/useSession";
import { Events, track } from "@/lib/analytics";
import { useLanguage } from "./LanguageProvider";
import MarkdownRenderer from "./MarkdownRenderer";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY_PREFIX = "hg_coach_v1:";

function readHistory(deckSlug: string | null): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      `${STORAGE_KEY_PREFIX}${deckSlug ?? "global"}`,
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Msg =>
        m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"),
    );
  } catch {
    return [];
  }
}

export default function CoachChat({
  initialDeckSlug = null,
}: {
  initialDeckSlug?: string | null;
}) {
  const { lang } = useLanguage();
  const { user, loading: sessionLoading } = useSession();
  const [deckSlug, setDeckSlug] = useState<string | null>(initialDeckSlug);
  const [messages, setMessages] = useState<Msg[]>(() =>
    readHistory(initialDeckSlug),
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(
    null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  const t =
    lang === "zh"
      ? {
          title: "AI 教练",
          desc: "提问卡组思路、对阵处理、上分细节，AI 给出即时建议。",
          ph: "比如：抗压挑战祭师该怎么处理？",
          send: "发送",
          sending: "思考中…",
          clear: "新会话",
          notSignedIn: "登录后即可使用 AI 教练（免费每天 3 次）。",
          signIn: "登录",
          locked: "AI 教练尚未配置，请联系站长。",
          deck: "当前讨论的卡组",
          remove: "移除",
          quota: (used: number, limit: number) =>
            `今日已用 ${used}/${limit} 次免费额度`,
          quotaExhausted: "今日免费额度已用完，升级 Pro 解锁无限对话。",
          upgrade: "升级 Pro",
          quickstart: [
            "帮我分析当前流行的 Meta",
            "我刚上传说，下一步该练哪套卡组",
            "这套卡组该怎么对线萨满",
          ],
        }
      : {
          title: "AI Coach",
          desc: "Ask about deck strategy, matchup play, or climbing — get answers tuned to your meta.",
          ph: "e.g. How do I close out against control warrior?",
          send: "Send",
          sending: "Thinking…",
          clear: "New chat",
          notSignedIn: "Sign in to chat with the AI coach (3 free messages/day).",
          signIn: "Sign in",
          locked: "AI coach isn't configured on this deployment yet.",
          deck: "About deck",
          remove: "remove",
          quota: (used: number, limit: number) =>
            `${used}/${limit} free messages used today`,
          quotaExhausted:
            "Daily free quota used up — upgrade to Pro for unlimited coach access.",
          upgrade: "Upgrade to Pro",
          quickstart: [
            "What's the current meta look like?",
            "I just hit Legend — what deck should I learn next?",
            "How should I play this deck against aggro Hunter?",
          ],
        };

  // Persist on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${deckSlug ?? "global"}`,
        JSON.stringify(messages),
      );
    } catch {
      // quota / private mode — ignore
    }
  }, [messages, deckSlug]);

  // Auto-scroll to bottom on new content.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = async (prompt: string) => {
    if (busy) return;
    const text = prompt.trim();
    if (!text) return;
    setError(null);
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    track(Events.CoachMessageSent, {
      with_deck: deckSlug ? true : false,
      length: text.length,
      lang,
    });
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          lang,
          deck_slug: deckSlug,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        message?: string;
        usage?: { used: number; limit: number };
      };
      if (!res.ok || !data.text) {
        setError(data.message ?? `error ${res.status}`);
        if (res.status === 429) {
          track(Events.CoachLimitHit, { lang });
        } else {
          track(Events.CoachError, { status: res.status, error: data.error ?? null });
        }
        // Roll back optimistic user message? Keep it — they can see what they asked.
        if (data.usage) setUsage(data.usage);
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.text }]);
      if (data.usage) setUsage(data.usage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        `${STORAGE_KEY_PREFIX}${deckSlug ?? "global"}`,
      );
    }
  };

  if (sessionLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-sm text-gray-500">…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold gold-text mb-2">{t.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{t.notSignedIn}</p>
        <Link
          href={`/${lang}/login?next=/${lang}/coach`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold gold-text">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
      </header>

      {deckSlug && (
        <div className="card p-3 mb-4 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            {t.deck}:{" "}
            <Link
              href={`/${lang}/decks/${deckSlug}`}
              className="text-[#4fc3f7] hover:underline"
            >
              {deckSlug}
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setDeckSlug(null)}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            {t.remove}
          </button>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="card p-3 sm:p-4 mb-4 h-[55vh] overflow-y-auto scrollbar-thin space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-xs text-gray-500 space-y-2">
            <p>👋 {t.desc}</p>
            <div className="flex flex-col gap-2 mt-3">
              {t.quickstart.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-gray-300 hover:border-[#f0b232] hover:text-[#f0b232]"
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[#f0b232] text-[#0f1419]"
                  : "bg-[#0f1419] border border-[#2a3040] text-gray-200"
              }`}
            >
              {m.role === "assistant" ? (
                <MarkdownRenderer content={m.content} />
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 text-xs bg-[#0f1419] border border-[#2a3040] text-gray-500 italic">
              {t.sending}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs p-3">
          {error.includes("limit_reached") || error.includes("用尽") || error.includes("used up") ? (
            <>
              {t.quotaExhausted}{" "}
              <Link
                href={`/${lang}/pricing`}
                className="text-[#f0b232] underline"
              >
                {t.upgrade}
              </Link>
            </>
          ) : (
            error
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={2}
          maxLength={1500}
          placeholder={t.ph}
          className="flex-1 px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232] resize-none"
        />
        <div className="flex flex-col gap-2 w-24">
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="flex-1 px-3 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "…" : t.send}
          </button>
          <button
            type="button"
            onClick={newChat}
            disabled={busy || messages.length === 0}
            className="flex-1 px-3 py-2 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-xs text-gray-400 hover:text-[#f0b232] disabled:opacity-40"
          >
            {t.clear}
          </button>
        </div>
      </form>

      {usage && (
        <p className="mt-3 text-[11px] text-gray-500 text-center">
          {t.quota(usage.used, usage.limit)}
        </p>
      )}
    </div>
  );
}
