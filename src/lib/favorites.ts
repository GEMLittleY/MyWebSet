"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "./supabase-browser";

export type FavoriteType = "deck" | "card" | "guide";

export type FavoriteRow = {
  user_id: string;
  target_type: FavoriteType;
  target_id: string;
  created_at: string;
};

export type FavoritesState = {
  /** Auth-loading or initial fetch in flight. */
  loading: boolean;
  /** Logged-in user id, or null. */
  userId: string | null;
  /** Map keyed `${type}:${id}` → created_at iso, for O(1) lookup. */
  index: ReadonlyMap<string, string>;
  isFavorite: (type: FavoriteType, id: string) => boolean;
  toggle: (type: FavoriteType, id: string) => Promise<{
    ok: boolean;
    favorited: boolean;
    requireLogin?: boolean;
    error?: string;
  }>;
};

const FavContext = createContext<FavoritesState | null>(null);

const key = (t: FavoriteType, id: string) => `${t}:${id}`;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState<Map<string, string>>(new Map());

  // Auth subscription — when user changes, reload favourites.
  // createBrowserClient caches the underlying client per process so calling
  // it again here is essentially free.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!id) {
        setIndex(new Map());
        setLoading(false);
        return;
      }
      supabase
        .from("favorites")
        .select("target_type,target_id,created_at")
        .eq("user_id", id)
        .then(({ data: rows }) => {
          if (!mounted) return;
          const next = new Map<string, string>();
          (rows ?? []).forEach((r) => {
            next.set(
              key(r.target_type as FavoriteType, r.target_id as string),
              r.created_at as string,
            );
          });
          setIndex(next);
          setLoading(false);
        });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (!id) {
        setIndex(new Map());
      } else {
        supabase
          .from("favorites")
          .select("target_type,target_id,created_at")
          .eq("user_id", id)
          .then(({ data: rows }) => {
            if (!mounted) return;
            const next = new Map<string, string>();
            (rows ?? []).forEach((r) => {
              next.set(
                key(r.target_type as FavoriteType, r.target_id as string),
                r.created_at as string,
              );
            });
            setIndex(next);
          });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isFavorite = useCallback(
    (t: FavoriteType, id: string) => index.has(key(t, id)),
    [index],
  );

  const toggle = useCallback<FavoritesState["toggle"]>(
    async (t, id) => {
      if (!userId) {
        return { ok: false, favorited: false, requireLogin: true };
      }
      const k = key(t, id);
      const supabase = createClient();

      // Optimistic update.
      const had = index.has(k);
      setIndex((prev) => {
        const next = new Map(prev);
        if (had) next.delete(k);
        else next.set(k, new Date().toISOString());
        return next;
      });

      if (had) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .match({ user_id: userId, target_type: t, target_id: id });
        if (error) {
          // Roll back.
          setIndex((prev) => {
            const next = new Map(prev);
            next.set(k, new Date().toISOString());
            return next;
          });
          return { ok: false, favorited: true, error: error.message };
        }
        return { ok: true, favorited: false };
      }

      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, target_type: t, target_id: id });
      if (error) {
        setIndex((prev) => {
          const next = new Map(prev);
          next.delete(k);
          return next;
        });
        return { ok: false, favorited: false, error: error.message };
      }
      return { ok: true, favorited: true };
    },
    [index, userId],
  );

  const value = useMemo<FavoritesState>(
    () => ({ loading, userId, index, isFavorite, toggle }),
    [loading, userId, index, isFavorite, toggle],
  );

  return createElement(FavContext.Provider, { value }, children);
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavContext);
  if (!ctx) {
    // Sensible no-op default so components can be rendered outside a provider
    // (e.g. in admin pages) without crashing.
    return {
      loading: true,
      userId: null,
      index: new Map(),
      isFavorite: () => false,
      toggle: async () => ({
        ok: false,
        favorited: false,
        requireLogin: true,
      }),
    };
  }
  return ctx;
}
