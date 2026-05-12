"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase-browser";

export type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsState = {
  loading: boolean;
  list: NotificationRow[];
  unread: number;
};

const PAGE = 30;

export function useNotifications(userId: string | null): NotificationsState & {
  refresh: () => void;
  markRead: (ids: number[] | "all") => Promise<void>;
} {
  const [list, setList] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!userId) {
      setLoading(false);
      setList([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE)
      .then(({ data }) => {
        setList((data ?? []) as NotificationRow[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    const cancelled = { current: false };
    if (!userId) {
      Promise.resolve().then(() => {
        if (cancelled.current) return;
        setList([]);
        setLoading(false);
      });
      return () => {
        cancelled.current = true;
      };
    }

    const supabase = createClient();
    Promise.resolve().then(() => {
      if (!cancelled.current) setLoading(true);
    });

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE)
      .then(({ data }) => {
        if (cancelled.current) return;
        setList((data ?? []) as NotificationRow[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch — cheap because the page is small.
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(PAGE)
            .then(({ data }) => {
              if (cancelled.current) return;
              setList((data ?? []) as NotificationRow[]);
            });
        },
      )
      .subscribe();

    return () => {
      cancelled.current = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead: (ids: number[] | "all") => Promise<void> = async (ids) => {
    if (!userId) return;
    const supabase: SupabaseClient = createClient();
    if (ids === "all") {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null)
        .eq("user_id", userId);
      if (!error) {
        setList((prev) =>
          prev.map((n) =>
            n.read_at ? n : { ...n, read_at: new Date().toISOString() },
          ),
        );
      }
      return;
    }
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);
    if (!error) {
      const set = new Set(ids);
      setList((prev) =>
        prev.map((n) =>
          set.has(n.id)
            ? { ...n, read_at: n.read_at ?? new Date().toISOString() }
            : n,
        ),
      );
    }
  };

  const unread = list.filter((n) => !n.read_at).length;

  return { loading, list, unread, refresh, markRead };
}
