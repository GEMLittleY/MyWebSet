"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="border-b border-[#2a3040] bg-[#0f1419]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold gold-text">⚔️ {t.siteName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/decks" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            {t.nav.decks}
          </Link>
          <Link href="/guides" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            {t.nav.guides}
          </Link>
          <Link href="/meta" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            {t.nav.meta}
          </Link>
          <Link href="/recommend" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            {t.nav.recommend}
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              lang === "en"
                ? "bg-[#f0b232] text-[#0f1419] font-bold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("zh")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              lang === "zh"
                ? "bg-[#f0b232] text-[#0f1419] font-bold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            中文
          </button>
        </div>
      </div>
    </header>
  );
}
