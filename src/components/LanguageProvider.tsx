"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { type Lang, getDict } from "@/lib/i18n";

type LanguageContextType = {
  lang: Lang;
  t: ReturnType<typeof getDict>;
  /**
   * Prefix a path with the current locale.
   *   localePath("/decks")        -> "/en/decks" | "/zh/decks"
   *   localePath("/")             -> "/en" | "/zh"
   *   localePath("/decks/foo")    -> "/en/decks/foo" | "/zh/decks/foo"
   */
  localePath: (path: string) => string;
};

const DEFAULT: LanguageContextType = {
  lang: "en",
  t: getDict("en"),
  localePath: (p: string) => `/en${normalize(p)}`,
};

const LanguageContext = createContext<LanguageContextType>(DEFAULT);

function normalize(path: string): string {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function LanguageProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const localePath = useCallback(
    (path: string) => `/${lang}${normalize(path)}`,
    [lang],
  );

  const value = useMemo<LanguageContextType>(
    () => ({ lang, t: getDict(lang), localePath }),
    [lang, localePath],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
