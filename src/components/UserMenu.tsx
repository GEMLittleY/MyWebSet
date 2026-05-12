"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { createClient } from "@/lib/supabase-browser";
import { useLanguage } from "./LanguageProvider";

export default function UserMenu() {
  const { lang, localePath } = useLanguage();
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? `/${lang}`;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const closeMenu = () => setOpen(false);

  const t =
    lang === "zh"
      ? {
          signIn: "登录",
          account: "我的账户",
          favorites: "我的收藏",
          decks: "我的卡组",
          notifications: "通知",
          signOut: "退出登录",
        }
      : {
          signIn: "Sign in",
          account: "Account",
          favorites: "Favourites",
          decks: "My decks",
          notifications: "Notifications",
          signOut: "Sign out",
        };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-[#1a1f2e] animate-pulse ml-1" aria-hidden />;
  }

  if (!user) {
    const next = pathname || `/${lang}`;
    return (
      <Link
        href={`/${lang}/login?next=${encodeURIComponent(next)}`}
        className="ml-1 px-3 py-1.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-xs font-medium hover:bg-[#d4982a]"
      >
        {t.signIn}
      </Link>
    );
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (meta.name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.user_name as string | undefined) ??
    user.email ??
    "?";
  const avatar =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;

  const handleSignOut = async () => {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  return (
    <div ref={wrapRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-[#2a3040] hover:border-[#f0b232]/50 transition-colors"
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={28}
            height={28}
            className="rounded-full"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#2a3040] flex items-center justify-center text-xs text-gray-300">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0f1419] border border-[#2a3040] shadow-xl py-2 z-[60]"
        >
          <div className="px-4 py-2 border-b border-[#2a3040]/60 mb-1">
            <p className="text-sm text-[#e8e6e3] truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href={localePath("/account")}
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-[#f0b232]"
          >
            {t.account}
          </Link>
          <Link
            role="menuitem"
            href={localePath("/account/favorites")}
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-[#f0b232]"
          >
            {t.favorites}
          </Link>
          <Link
            role="menuitem"
            href={localePath("/account/decks")}
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-[#f0b232]"
          >
            {t.decks}
          </Link>
          <Link
            role="menuitem"
            href={localePath("/account/notifications")}
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-[#f0b232]"
          >
            {t.notifications}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 mt-1 text-sm text-red-300 hover:bg-[#1a1f2e] hover:text-red-200 border-t border-[#2a3040]/60"
          >
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
