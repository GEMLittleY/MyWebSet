"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "./supabase-browser";

export type SessionState = {
  user: User | null;
  loading: boolean;
};

/**
 * Subscribes to Supabase auth events and exposes the current user.
 * Renders `loading: true` until the first session check resolves so callers
 * can avoid flashing "Sign in" while a logged-in user hydrates.
 */
export function useSession(): SessionState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
