"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FeatureKey } from "./pro";

type State = {
  used: number;
  limit: number | undefined;
  remaining: number | undefined;
  atLimit: boolean;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
}

function storageKey(feature: FeatureKey) {
  return `hg_usage_${feature}_${todayKey()}`;
}

function readUsed(feature: FeatureKey): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(storageKey(feature));
  return raw ? Number(raw) || 0 : 0;
}

function subscribeStorage(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

/**
 * Tracks per-day usage of a metered feature on the client side. Uses
 * useSyncExternalStore so SSR + cross-tab updates are safe.
 */
export function useUsageLimit(
  feature: FeatureKey,
  limit: number | undefined,
): State & { record: () => void; reset: () => void } {
  const used = useSyncExternalStore(
    subscribeStorage,
    () => readUsed(feature),
    () => 0,
  );

  const record = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = readUsed(feature) + 1;
    window.localStorage.setItem(storageKey(feature), String(next));
    // Notify same-tab subscribers via a synthetic storage event.
    window.dispatchEvent(new StorageEvent("storage"));
  }, [feature]);

  const reset = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey(feature));
    window.dispatchEvent(new StorageEvent("storage"));
  }, [feature]);

  return {
    used,
    limit,
    remaining: limit === undefined ? undefined : Math.max(0, limit - used),
    atLimit: limit !== undefined && used >= limit,
    record,
    reset,
  };
}
