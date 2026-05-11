"use client";

import { useSyncExternalStore } from "react";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("hg_pro") === "1";
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

/**
 * Pro status hook. Will be replaced by a Supabase-backed implementation in
 * P3.3 (Stripe + Paddle subscriptions). For now reads a dev override from
 * localStorage so the gated UI can be previewed.
 */
export function useIsPro(): { isPro: boolean; loading: boolean } {
  const isPro = useSyncExternalStore(subscribe, read, () => false);
  return { isPro, loading: false };
}
