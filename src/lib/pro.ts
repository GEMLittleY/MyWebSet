/**
 * Pro-subscription primitives. Webhooks (Stripe + Paddle) flip the
 * `is_pro` / `pro_until` columns on `profiles`; everything else in the
 * app reads through the helpers below.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

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

export const BillingProviders = ["stripe", "paddle"] as const;
export type BillingProvider = (typeof BillingProviders)[number];

export type BillingPlan = "monthly" | "annual";

export type ProStatus = {
  isPro: boolean;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "none";
  proUntil: string | null;
  provider: BillingProvider | null;
};

const EMPTY: ProStatus = {
  isPro: false,
  status: "none",
  proUntil: null,
  provider: null,
};

/**
 * Reads Pro state for the given user id. We materialise `is_pro` on the
 * profile so the hot path is a single keyed lookup. The function falls
 * back to a "free" status on any error (so a transient DB outage cannot
 * accidentally hand out Pro features).
 */
export async function getProStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProStatus> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "is_pro,pro_until,billing_provider,billing_status",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return EMPTY;
    const proUntil = data.pro_until ?? null;
    // Re-check the soft expiry just in case a cancel webhook was missed.
    let isPro = Boolean(data.is_pro);
    if (isPro && proUntil) {
      isPro = new Date(proUntil).getTime() > Date.now();
    }
    return {
      isPro,
      status:
        (data.billing_status as ProStatus["status"]) ??
        (isPro ? "active" : "none"),
      proUntil,
      provider:
        (data.billing_provider as ProStatus["provider"]) ??
        (isPro ? "stripe" : null),
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Static billing config. Read once at request time so changing env on
 * Vercel takes effect without redeploying every file that uses it.
 */
export function billingConfig() {
  return {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? null,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
      priceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
      priceAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? null,
      portalReturnUrl:
        process.env.STRIPE_PORTAL_RETURN_URL ?? null,
    },
    paddle: {
      webhookSecret: process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? null,
      priceMonthly: process.env.PADDLE_PRICE_PRO_MONTHLY ?? null,
      priceAnnual: process.env.PADDLE_PRICE_PRO_ANNUAL ?? null,
    },
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
  };
}
