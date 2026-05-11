/**
 * Pro-subscription primitives. Currently every user is on the Free tier;
 * P3.3 will wire this up to Stripe / Paddle webhooks → Supabase `subscriptions`
 * table → `useIsPro()` hook reading the authenticated session.
 *
 * The shape is fixed now so that all downstream features (RequirePro,
 * useUsageLimit, ProBadge, /pricing) work on day one and start charging
 * when subscriptions are switched on.
 */

export type Plan = "free" | "pro";

export type FeatureKey =
  | "ai-coach"
  | "collection-diff"
  | "advanced-meta"
  | "deck-builder-saves"
  | "remove-ads";

export const FREE_LIMITS: Partial<Record<FeatureKey, number>> = {
  "ai-coach": 3, // per day
  "collection-diff": 5, // per day
};

export const PRO_PRICE_USD = 4.99;
export const PRO_PRICE_USD_ANNUAL = 39;
