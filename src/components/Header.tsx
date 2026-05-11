"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export default function Header() {
  const { lang, t, localePath } = useLanguage();
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build the same path but in the other language.
  const switchLangHref = (target: "en" | "zh") => {
    if (pathname.startsWith(`/${lang}/`)) {
      return pathname.replace(`/${lang}/`, `/${target}/`);
    }
    if (pathname === `/${lang}`) {
      return `/${target}`;
    }
    return `/${target}`;
  };

  const nav = [
    { href: localePath("/decks"), label: t.nav.decks },
    { href: localePath("/cards"), label: t.nav.cards },
    { href: localePath("/builder"), label: t.nav.builder },
    { href: localePath("/guides"), label: t.nav.guides },
    { href: localePath("/meta"), label: t.nav.meta },
    { href: localePath("/recommend"), label: t.nav.recommend },
  ];

  return (
    <header className="border-b border-[#2a3040] bg-[#0f1419]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={localePath("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-xl font-bold gold-text">
            <span aria-hidden>⚔️ </span>
            {t.siteName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={switchLangHref("en")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              lang === "en"
                ? "bg-[#f0b232] text-[#0f1419] font-bold"
                : "text-gray-500 hover:text-gray-300"
            }`}
            aria-label="Switch to English"
            prefetch={false}
          >
            EN
          </Link>
          <Link
            href={switchLangHref("zh")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              lang === "zh"
                ? "bg-[#f0b232] text-[#0f1419] font-bold"
                : "text-gray-500 hover:text-gray-300"
            }`}
            aria-label="切换到简体中文"
            prefetch={false}
          >
            中文
          </Link>
          <button
            type="button"
            className="md:hidden ml-2 inline-flex items-center justify-center w-9 h-9 rounded text-gray-300 hover:text-[#f0b232]"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-[#2a3040] bg-[#0f1419]">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-sm text-gray-300 hover:text-[#f0b232]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
