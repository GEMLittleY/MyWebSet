"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Events, track } from "@/lib/analytics";

type Lang = "en" | "zh";

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

  const [pendingProvider, setPendingProvider] = useState<"github" | null>(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const t =
    lang === "zh"
      ? {
          headline: "登录 HearthGuide",
          sub: "登录后可以收藏卡组、保存自己的构筑、参与评论。",
          github: "使用 GitHub 登录",
          githubGoing: "跳转中…",
          or: "或使用邮箱",
          emailPh: "you@example.com",
          send: "发送登录链接",
          sending: "发送中…",
          sent: "已发送，请在邮箱中点击链接完成登录。",
          legal: "登录即表示你同意",
          terms: "服务条款",
          and: "和",
          privacy: "隐私政策",
          authFailed: "登录失败，请重试",
          comingSoon: "Google 与 Discord 登录即将开放",
        }
      : {
          headline: "Sign in to HearthGuide",
          sub: "Save favourites, build your own decks, join the discussion.",
          github: "Continue with GitHub",
          githubGoing: "Redirecting…",
          or: "or use email",
          emailPh: "you@example.com",
          send: "Email me a magic link",
          sending: "Sending…",
          sent: "Check your inbox and click the link to finish signing in.",
          legal: "By signing in you agree to our",
          terms: "Terms",
          and: "and",
          privacy: "Privacy Policy",
          authFailed: "Sign-in failed. Please try again.",
          comingSoon: "Google and Discord sign-in coming soon",
        };

  const signInWithGithub = async () => {
    setPendingProvider("github");
    setLocalError(null);
    track(Events.SignInStart, { provider: "github" });
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callback.toString() },
      });
      if (e) {
        setLocalError(e.message);
        setPendingProvider(null);
      }
      // success — Supabase navigates the window away
    } catch (e) {
      setLocalError((e as Error).message);
      setPendingProvider(null);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailSubmitting(true);
    setLocalError(null);
    track(Events.SignInStart, { provider: "email" });
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      const { error: e2 } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callback.toString() },
      });
      if (e2) {
        setLocalError(e2.message);
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setEmailSubmitting(false);
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

      <button
        type="button"
        onClick={signInWithGithub}
        disabled={pendingProvider !== null || emailSubmitting}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg font-medium bg-[#1f2329] hover:bg-[#2c2f36] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
          <path d="M12 0c-6.6 0-12 5.4-12 12 0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.7.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.8-1.6 8.2-6.1 8.2-11.4 0-6.6-5.4-12-12-12z" />
        </svg>
        <span className="text-sm">
          {pendingProvider === "github" ? t.githubGoing : t.github}
        </span>
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-gray-600">
        <span className="flex-1 h-px bg-[#2a3040]" />
        <span>{t.or}</span>
        <span className="flex-1 h-px bg-[#2a3040]" />
      </div>

      {emailSent ? (
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-700/40 text-emerald-200 text-sm p-4">
          {t.sent}
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder={t.emailPh}
            autoComplete="email"
            className="w-full px-3 py-2.5 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
          />
          <button
            type="submit"
            disabled={
              pendingProvider !== null || emailSubmitting || !email.trim()
            }
            className="w-full py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {emailSubmitting ? t.sending : t.send}
          </button>
        </form>
      )}

      <p className="text-[11px] text-gray-600 mt-6 text-center">
        {t.comingSoon}
      </p>

      <p className="text-xs text-gray-600 mt-6 text-center leading-relaxed">
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
