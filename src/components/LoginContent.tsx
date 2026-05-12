"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Provider } from "@supabase/supabase-js";

type Lang = "en" | "zh";

const PROVIDERS: Array<{
  id: Provider;
  label: { en: string; zh: string };
  bg: string;
  fg: string;
  icon: React.ReactNode;
}> = [
  {
    id: "google",
    label: { en: "Continue with Google", zh: "使用 Google 登录" },
    bg: "bg-white hover:bg-gray-100",
    fg: "text-gray-900",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.5 2.7-3.8 2.7-6.4z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 16.1 5.5 18 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.6 0 9s.3 2.8.9 4l3-2.3z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 1.9.9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: "discord",
    label: { en: "Continue with Discord", zh: "使用 Discord 登录" },
    bg: "bg-[#5865F2] hover:bg-[#4752c4]",
    fg: "text-white",
    icon: (
      <svg width="18" height="18" viewBox="0 0 71 55" aria-hidden fill="currentColor">
        <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4l-.7 1.4a52.4 52.4 0 0 0-14.7 0L29.5.4a58.5 58.5 0 0 0-14.6 4.5C5.7 17.6 3.2 30.1 4.5 42.4a58.4 58.4 0 0 0 17.6 8.7l3.5-5a37 37 0 0 1-5.5-2.6 1.5 1.5 0 0 1-.1-2.4 39.8 39.8 0 0 0 30.4 0 1.5 1.5 0 0 1 0 2.4c-1.7 1-3.5 1.9-5.5 2.6l3.5 5a58.4 58.4 0 0 0 17.6-8.7c1.5-13.6-1.7-26-12.9-37.5zM23.7 35.8c-3.5 0-6.4-3.2-6.4-7.1 0-4 2.8-7.1 6.4-7.1 3.6 0 6.5 3.2 6.4 7.1 0 4-2.8 7.1-6.4 7.1zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1 0-4 2.8-7.1 6.4-7.1 3.6 0 6.5 3.2 6.4 7.1 0 4-2.8 7.1-6.4 7.1z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: { en: "Continue with GitHub", zh: "使用 GitHub 登录" },
    bg: "bg-[#1f2329] hover:bg-[#2c2f36]",
    fg: "text-white",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
        <path d="M12 0c-6.6 0-12 5.4-12 12 0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.7.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.8-1.6 8.2-6.1 8.2-11.4 0-6.6-5.4-12-12-12z" />
      </svg>
    ),
  },
];

export default function LoginContent({
  lang,
  next: nextFromProps,
  error: errorFromProps,
}: {
  lang: Lang;
  next?: string;
  error?: string;
}) {
  // Also pick up next/error from URL on the client (covers in-app nav).
  const sp = useSearchParams();
  const next = nextFromProps ?? sp?.get("next") ?? `/${lang}`;
  const error = errorFromProps ?? sp?.get("error") ?? null;

  const [pending, setPending] = useState<Provider | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const t =
    lang === "zh"
      ? {
          headline: "登录 HearthGuide",
          sub: "登录后可以收藏卡组、保存自己的构筑、参与评论。",
          back: "← 返回",
          legal: "登录即表示你同意",
          terms: "服务条款",
          and: "和",
          privacy: "隐私政策",
          authFailed: "登录失败，请重试",
        }
      : {
          headline: "Sign in to HearthGuide",
          sub: "Save favourites, manage your own builds, comment on guides.",
          back: "← Back",
          legal: "By signing in you agree to our",
          terms: "Terms",
          and: "and",
          privacy: "Privacy Policy",
          authFailed: "Sign-in failed. Please try again.",
        };

  const signInWith = async (provider: Provider) => {
    setPending(provider);
    setLocalError(null);
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });
      if (error) {
        setLocalError(error.message);
        setPending(null);
      }
      // success — Supabase navigates the window away
    } catch (e) {
      setLocalError((e as Error).message);
      setPending(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold gold-text mb-2">{t.headline}</h1>
      <p className="text-sm text-gray-500 mb-8">{t.sub}</p>

      {(error || localError) && (
        <div className="mb-5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm p-3">
          {localError ?? t.authFailed}
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => signInWith(p.id)}
            disabled={pending !== null}
            className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-lg font-medium ${p.bg} ${p.fg} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {p.icon}
            <span className="text-sm">
              {pending === p.id
                ? lang === "zh"
                  ? "跳转中…"
                  : "Redirecting…"
                : p.label[lang]}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-8 text-center leading-relaxed">
        {t.legal}{" "}
        <a className="text-[#4fc3f7] hover:underline" href={`/${lang}/legal/terms`}>
          {t.terms}
        </a>{" "}
        {t.and}{" "}
        <a className="text-[#4fc3f7] hover:underline" href={`/${lang}/legal/privacy`}>
          {t.privacy}
        </a>
        .
      </p>
    </div>
  );
}
