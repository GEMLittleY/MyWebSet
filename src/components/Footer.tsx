"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#2a3040] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold gold-text mb-3">⚔️ {t.siteName}</h3>
            <p className="text-sm text-gray-500">{t.footer.desc}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">
              {t.nav.home === "Home" ? "Navigation" : "导航"}
            </h4>
            <div className="space-y-2">
              <Link href="/decks" className="block text-sm text-gray-500 hover:text-[#f0b232]">{t.nav.decks}</Link>
              <Link href="/guides" className="block text-sm text-gray-500 hover:text-[#f0b232]">{t.nav.guides}</Link>
              <Link href="/meta" className="block text-sm text-gray-500 hover:text-[#f0b232]">{t.nav.meta}</Link>
              <Link href="/recommend" className="block text-sm text-gray-500 hover:text-[#f0b232]">{t.nav.recommend}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">
              {t.nav.home === "Home" ? "About" : "关于"}
            </h4>
            <p className="text-sm text-gray-500">
              {t.nav.home === "Home"
                ? "HearthGuide is a free Hearthstone strategy site to help players understand the meta and climb the ladder."
                : "HearthGuide 是一个免费的炉石传说攻略站，帮助玩家更好地了解当前 Meta 并选择合适的卡组上分。"}
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#2a3040] text-center text-xs text-gray-600">
          © {new Date().getFullYear()} HearthGuide. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
