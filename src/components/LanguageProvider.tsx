"use client";

import { createContext, useContext, useState, useSyncExternalStore, useCallback, type ReactNode } from "react";
import { type Lang, getDict } from "@/lib/i18n";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: ReturnType<typeof getDict>;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "zh",
  setLang: () => {},
  t: getDict("zh"),
});

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const saved = localStorage.getItem("hg-lang");
  return saved === "en" ? "en" : "zh";
}

function subscribeLang(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const initialLang = useSyncExternalStore(subscribeLang, getStoredLang, () => "zh" as Lang);
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("hg-lang", newLang);
    document.documentElement.lang = newLang === "zh" ? "zh-CN" : "en";
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: getDict(lang) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
