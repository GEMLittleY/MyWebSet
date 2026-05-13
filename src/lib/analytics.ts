// Thin, dependency-free wrapper around posthog-js + Vercel Analytics.
//
// Design notes:
// - PostHog is the source of truth for funnel events. Vercel Analytics
//   handles raw pageviews and Web Vitals.
// - We never ship PII to either. Pass already-hashed or non-identifying
//   props.
// - If NEXT_PUBLIC_POSTHOG_KEY is unset (dev / preview), every call is a
//   no-op so consumers don't have to feature-flag.
// - `track()` is safe to call from any client component, including
//   inside effects. It deliberately swallows errors.

// We only call a handful of methods, so widen to a minimal shape and avoid
// the dance with PostHog vs. PostHogInterface (the latter is what `loaded`
// receives, while the global module export is the former).
type PHLike = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (distinctId: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

declare global {
  interface Window {
    __hg_posthog?: PHLike | null;
  }
}

let initStarted = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initStarted) return;
  initStarted = true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  // Honour Do-Not-Track to be a good citizen even with cookie-less mode.
  // PostHog respects it itself but we belt-and-brace.
  if (
    typeof navigator !== "undefined" &&
    "doNotTrack" in navigator &&
    navigator.doNotTrack === "1"
  ) {
    return;
  }
  // Lazy-load so the chunk only ships when the env key is present.
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
        disable_session_recording: true,
        autocapture: false,
        loaded: (ph) => {
          window.__hg_posthog = ph as unknown as PHLike;
        },
      });
    })
    .catch(() => {
      // analytics is best-effort
    });
}

export type TrackProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export function track(event: string, props?: TrackProps) {
  if (typeof window === "undefined") return;
  const ph = window.__hg_posthog;
  if (!ph) return;
  try {
    ph.capture(event, props);
  } catch {
    // analytics is best-effort
  }
}

export function identify(distinctId: string, props?: TrackProps) {
  if (typeof window === "undefined") return;
  const ph = window.__hg_posthog;
  if (!ph) return;
  try {
    ph.identify(distinctId, props);
  } catch {
    // best-effort
  }
}

export function resetUser() {
  if (typeof window === "undefined") return;
  const ph = window.__hg_posthog;
  if (!ph) return;
  try {
    ph.reset();
  } catch {
    // best-effort
  }
}

/**
 * Canonical event names. Keep the union in sync with the funnels defined
 * in the PostHog dashboard so analytics never silently lose events from
 * a typo.
 */
export const Events = {
  // pageviews are auto-captured; these are extra semantic checkpoints
  ViewDeck: "view_deck",
  ViewDeckDiff: "view_deck_diff",
  ViewCoach: "view_coach",
  ViewPricing: "view_pricing",
  ViewCollection: "view_collection",
  // auth
  SignInStart: "signin_start",
  SignInComplete: "signin_complete",
  // coach
  CoachMessageSent: "coach_message_sent",
  CoachLimitHit: "coach_limit_hit",
  CoachError: "coach_error",
  // builder
  DeckSave: "deck_save",
  DeckPublish: "deck_publish",
  DeckExport: "deck_export",
  // collection
  CollectionImport: "collection_import",
  CollectionEdit: "collection_edit",
  // pricing
  PricingCtaClick: "pricing_cta_click",
  WaitlistSignup: "waitlist_signup",
} as const;
