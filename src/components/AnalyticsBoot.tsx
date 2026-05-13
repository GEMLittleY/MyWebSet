"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/useSession";
import { identify, initAnalytics, resetUser } from "@/lib/analytics";

/**
 * Mount once at the app root. Initialises PostHog (if configured) and
 * keeps its identity in sync with Supabase auth state.
 *
 * NOTE: This component intentionally renders nothing.
 */
export default function AnalyticsBoot() {
  const { user, loading } = useSession();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Distinct id = Supabase auth uid; no PII in props.
      identify(user.id, {
        provider: user.app_metadata?.provider ?? null,
        is_pro: false, // wired up once billing lands
      });
    } else {
      resetUser();
    }
  }, [user, loading]);

  return null;
}
