"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/profile";

type Lang = "en" | "zh";

type ProfileWithBilling = Profile & {
  is_pro?: boolean;
  pro_until?: string | null;
  billing_provider?: string | null;
  billing_status?: string | null;
  stripe_customer_id?: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  discord: "Discord",
  github: "GitHub",
  email: "Email",
};

export default function AccountContent({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileWithBilling | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const t =
    lang === "zh"
      ? {
          title: "我的账户",
          loading: "加载中…",
          notSignedIn: "你还没有登录。",
          signIn: "去登录",
          email: "邮箱",
          provider: "登录方式",
          name: "昵称",
          bio: "个人简介",
          bioPh: "用一句话介绍一下你自己…",
          save: "保存修改",
          saving: "保存中…",
          saved: "已保存",
          signOut: "退出登录",
          backHome: "返回首页",
          favorites: "我的收藏",
          myDecks: "我的卡组",
          comingSoon: "即将上线",
          memberSince: "注册时间",
        }
      : {
          title: "Your account",
          loading: "Loading…",
          notSignedIn: "You're not signed in.",
          signIn: "Sign in",
          email: "Email",
          provider: "Signed in via",
          name: "Display name",
          bio: "Bio",
          bioPh: "Tell other players a bit about yourself…",
          save: "Save changes",
          saving: "Saving…",
          saved: "Saved",
          signOut: "Sign out",
          backHome: "Back to home",
          favorites: "Favourites",
          myDecks: "My decks",
          comingSoon: "Coming soon",
          memberSince: "Member since",
        };

  // We expose this so handleSave can refresh after an update. Each call gets
  // its own cancellation token so older fetches can't clobber newer state.
  const fetchProfile = (cancelled: { current: boolean }) => {
    const supabase = createClient();
    return supabase.auth.getUser().then(({ data: userData }) => {
      if (cancelled.current) return;
      const user = userData.user;
      if (!user) {
        setLoading(false);
        setProfile(null);
        return;
      }
      setEmail(user.email ?? null);
      return supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error: profileErr }) => {
          if (cancelled.current) return;
          if (profileErr) {
            setError(profileErr.message);
            setLoading(false);
            return;
          }
          const p = (data as ProfileWithBilling | null) ?? null;
          setProfile(p);
          setDraftName(p?.display_name ?? "");
          setDraftBio(p?.bio ?? "");
          setLoading(false);
        });
    });
  };

  useEffect(() => {
    const cancelled = { current: false };
    fetchProfile(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        display_name: draftName.trim() || null,
        bio: draftBio.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setSavedAt(Date.now());
    fetchProfile({ current: false });
  };

  const openPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const res = await fetch(`/api/billing/portal?lang=${lang}`, {
        method: "POST",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(
          data.error ??
            (lang === "zh"
              ? "无法打开订阅管理"
              : "Could not open billing portal"),
        );
      }
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "network error");
    } finally {
      setPortalBusy(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-gray-500 text-sm">{t.loading}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold gold-text mb-3">{t.title}</h1>
        <p className="text-gray-400 mb-6">{t.notSignedIn}</p>
        <Link
          href={`/${lang}/login?next=/${lang}/account`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  const dirty =
    (draftName.trim() || null) !== (profile.display_name ?? null) ||
    (draftBio.trim() || null) !== (profile.bio ?? null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold gold-text mb-8">{t.title}</h1>

      {error && (
        <div className="mb-5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm p-3">
          {error}
        </div>
      )}

      <section className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? "avatar"}
              width={64}
              height={64}
              className="rounded-full border border-[#2a3040]"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#2a3040] flex items-center justify-center text-xl text-gray-300">
              {(profile.display_name ?? email ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-base font-medium text-[#e8e6e3] truncate">
              {profile.display_name ?? email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {t.email}: {email ?? "—"}
            </p>
            <p className="text-xs text-gray-500">
              {t.provider}:{" "}
              <span className="text-gray-300">
                {PROVIDER_LABEL[profile.provider ?? "email"] ?? profile.provider ?? "—"}
              </span>
            </p>
          </div>
        </div>

        <label className="block text-xs text-gray-500 mb-1">{t.name}</label>
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          maxLength={48}
          className="w-full mb-4 px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232]"
        />

        <label className="block text-xs text-gray-500 mb-1">{t.bio}</label>
        <textarea
          value={draftBio}
          onChange={(e) => setDraftBio(e.target.value)}
          rows={3}
          maxLength={240}
          placeholder={t.bioPh}
          className="w-full mb-4 px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232] resize-none"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-5 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? t.saving : t.save}
          </button>
          {savedAt && !dirty && (
            <span className="text-xs text-emerald-400">{t.saved}</span>
          )}
          <span className="ml-auto text-xs text-gray-500">
            {t.memberSince}:{" "}
            {new Date(profile.created_at).toLocaleDateString(
              lang === "zh" ? "zh-CN" : "en-US",
            )}
          </span>
        </div>
      </section>

      <section className="card p-5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              {lang === "zh" ? "订阅" : "Subscription"}
            </p>
            {profile.is_pro ? (
              <>
                <p className="text-sm text-[#f0b232] font-semibold">
                  HearthGuide Pro
                  {profile.billing_status === "trialing" && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">
                      {lang === "zh" ? "试用" : "trial"}
                    </span>
                  )}
                </p>
                {profile.pro_until && (
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === "zh" ? "下次续期：" : "Renews: "}
                    {new Date(profile.pro_until).toLocaleDateString(
                      lang === "zh" ? "zh-CN" : "en-US",
                    )}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-300">
                  {lang === "zh" ? "免费版" : "Free plan"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === "zh"
                    ? "升级 Pro 解锁 AI 教练无限次和高阶 Meta 工具。"
                    : "Upgrade to Pro for unlimited AI coach and advanced meta tools."}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {profile.is_pro ? (
              profile.stripe_customer_id ? (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={portalBusy}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a3040] text-xs text-gray-300 hover:border-[#f0b232] disabled:opacity-50"
                >
                  {portalBusy
                    ? "…"
                    : lang === "zh"
                      ? "管理订阅"
                      : "Manage billing"}
                </button>
              ) : null
            ) : (
              <Link
                href={`/${lang}/pricing`}
                className="px-3 py-1.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-xs font-medium hover:bg-[#d4982a] text-center"
              >
                {lang === "zh" ? "升级 Pro" : "Upgrade to Pro"}
              </Link>
            )}
          </div>
        </div>
        {portalError && (
          <p className="mt-2 text-xs text-red-400">{portalError}</p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/${lang}/account/favorites`}
          className="card p-5 hover:border-[#f0b232]/40 transition-colors"
        >
          <p className="text-sm font-medium text-[#e8e6e3] mb-1">{t.favorites}</p>
          <p className="text-xs text-gray-500">
            {lang === "zh"
              ? "收藏的卡组、攻略与卡牌"
              : "Saved decks, guides and cards"}
          </p>
        </Link>
        <Link
          href={`/${lang}/account/decks`}
          className="card p-5 hover:border-[#f0b232]/40 transition-colors"
        >
          <p className="text-sm font-medium text-[#e8e6e3] mb-1">{t.myDecks}</p>
          <p className="text-xs text-gray-500">
            {lang === "zh"
              ? "你保存的草稿和发布的变种"
              : "Saved drafts and published variants"}
          </p>
        </Link>
        <Link
          href={`/${lang}/account/collection`}
          className="card p-5 hover:border-[#f0b232]/40 transition-colors"
        >
          <p className="text-sm font-medium text-[#e8e6e3] mb-1">
            {lang === "zh" ? "我的卡牌收藏" : "Card collection"}
          </p>
          <p className="text-xs text-gray-500">
            {lang === "zh"
              ? "记录拥有的卡牌，自动算出造价缺口"
              : "Track owned cards; we'll compute real crafting cost"}
          </p>
        </Link>
        <Link
          href={`/${lang}/account/notifications`}
          className="card p-5 hover:border-[#f0b232]/40 transition-colors"
        >
          <p className="text-sm font-medium text-[#e8e6e3] mb-1">
            {lang === "zh" ? "通知" : "Notifications"}
          </p>
          <p className="text-xs text-gray-500">
            {lang === "zh"
              ? "评论回复与系统消息"
              : "Comment replies and system updates"}
          </p>
        </Link>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="px-5 py-2 rounded-lg border border-[#2a3040] text-sm text-red-300 hover:border-red-700 hover:text-red-200"
        >
          {t.signOut}
        </button>
        <Link
          href={`/${lang}`}
          className="text-sm text-gray-400 hover:text-[#f0b232]"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
