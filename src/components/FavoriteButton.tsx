"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFavorites, type FavoriteType } from "@/lib/favorites";
import { useLanguage } from "./LanguageProvider";

type Variant = "icon" | "icon-only" | "pill";

type Props = {
  type: FavoriteType;
  id: string;
  /** Visual variant. */
  variant?: Variant;
  /** Pass-through className for layout. */
  className?: string;
};

export default function FavoriteButton({
  type,
  id,
  variant = "icon",
  className = "",
}: Props) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { isFavorite, toggle, loading: favLoading } = useFavorites();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const active = isFavorite(type, id);

  const t =
    lang === "zh"
      ? {
          add: "收藏",
          remove: "取消收藏",
          loginNeeded: "请先登录",
          ariaActive: "已收藏",
          ariaInactive: "加入收藏",
        }
      : {
          add: "Save",
          remove: "Saved",
          loginNeeded: "Please sign in",
          ariaActive: "Remove from favourites",
          ariaInactive: "Add to favourites",
        };

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || favLoading) return;
    setBusy(true);
    setHint(null);
    const r = await toggle(type, id);
    setBusy(false);
    if (r.requireLogin) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : `/${lang}`;
      router.push(`/${lang}/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!r.ok && r.error) setHint(r.error);
  };

  const heart = (filled: boolean) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  if (variant === "icon-only" || variant === "icon") {
    const wrapBase =
      variant === "icon-only"
        ? "inline-flex items-center justify-center w-8 h-8 rounded-full"
        : "inline-flex items-center gap-1 px-2 py-1 rounded-md";
    const stateCls = active
      ? "text-pink-400 hover:text-pink-300"
      : "text-gray-500 hover:text-pink-400";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={active}
        aria-label={active ? t.ariaActive : t.ariaInactive}
        title={hint ?? (active ? t.remove : t.add)}
        className={`${wrapBase} ${stateCls} bg-black/40 backdrop-blur-sm border border-[#2a3040] hover:border-pink-400/50 transition-colors disabled:opacity-50 ${className}`}
      >
        {heart(active)}
        {variant === "icon" && (
          <span className="text-xs">{active ? t.remove : t.add}</span>
        )}
      </button>
    );
  }

  // pill
  const pillCls = active
    ? "bg-pink-500/20 text-pink-200 border-pink-400/40"
    : "bg-[#1a1f2e] text-gray-300 border-[#2a3040] hover:border-pink-400/40 hover:text-pink-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? t.ariaActive : t.ariaInactive}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-50 ${pillCls} ${className}`}
    >
      {heart(active)}
      <span>{active ? t.remove : t.add}</span>
      {hint && (
        <span className="ml-2 text-[10px] text-red-300" title={hint}>
          !
        </span>
      )}
    </button>
  );
}

/** Helper for use elsewhere — renders the localized `please sign in` link. */
export function LoginRequiredLink({ next }: { next?: string }) {
  const { lang } = useLanguage();
  const target =
    next ??
    (typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : `/${lang}`);
  return (
    <a
      href={`/${lang}/login?next=${encodeURIComponent(target)}`}
      className="text-[#4fc3f7] hover:underline"
    >
      {lang === "zh" ? "登录" : "sign in"}
    </a>
  );
}
