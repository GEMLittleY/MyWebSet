"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const { t, lang, localePath } = useLanguage();

  return (
    <footer className="border-t border-[#2a3040] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold gold-text mb-3">
              <span aria-hidden>⚔️ </span>
              {t.siteName}
            </h3>
            <p className="text-sm text-gray-500">{t.footer.desc}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">
              {lang === "en" ? "Navigation" : "导航"}
            </h4>
            <div className="space-y-2">
              <Link
                href={localePath("/decks")}
                className="block text-sm text-gray-500 hover:text-[#f0b232]"
              >
                {t.nav.decks}
              </Link>
              <Link
                href={localePath("/guides")}
                className="block text-sm text-gray-500 hover:text-[#f0b232]"
              >
                {t.nav.guides}
              </Link>
              <Link
                href={localePath("/meta")}
                className="block text-sm text-gray-500 hover:text-[#f0b232]"
              >
                {t.nav.meta}
              </Link>
              <Link
                href={localePath("/recommend")}
                className="block text-sm text-gray-500 hover:text-[#f0b232]"
              >
                {t.nav.recommend}
              </Link>
              <Link
                href={localePath("/pricing")}
                className="block text-sm text-gray-500 hover:text-[#f0b232]"
              >
                {lang === "en" ? "Pricing" : "Pro 方案"}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">
              {lang === "en" ? "About" : "关于"}
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              {lang === "en"
                ? "HearthGuide is a free Hearthstone strategy site to help players understand the meta and climb the ladder."
                : "HearthGuide 是一个免费的炉石传说攻略站，帮助玩家了解当前 Meta 并选择合适的卡组上分。"}
            </p>
            <div className="space-y-1">
              <Link
                href={localePath("/legal/privacy")}
                className="block text-xs text-gray-600 hover:text-[#f0b232]"
              >
                {lang === "en" ? "Privacy Policy" : "隐私政策"}
              </Link>
              <Link
                href={localePath("/legal/terms")}
                className="block text-xs text-gray-600 hover:text-[#f0b232]"
              >
                {lang === "en" ? "Terms of Service" : "服务条款"}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#2a3040] text-center text-xs text-gray-600 space-y-1">
          <p>
            © {new Date().getFullYear()} HearthGuide. {t.footer.rights}
          </p>
          <p>
            {lang === "en"
              ? "Hearthstone is a trademark of Blizzard Entertainment, Inc. This site is not affiliated with Blizzard."
              : "Hearthstone 是 Blizzard Entertainment, Inc. 的商标。本站非暴雪官方。"}
          </p>
        </div>
      </div>
    </footer>
  );
}
