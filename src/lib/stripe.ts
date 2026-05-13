import Stripe from "stripe";
import { billingConfig } from "./pro";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const cfg = billingConfig();
  if (!cfg.stripe.secretKey) return null;
  if (cached) return cached;
  cached = new Stripe(cfg.stripe.secretKey, {
    // Pin to the SDK's default API version so a Stripe-side default
    // bump can't change server behaviour silently between deploys.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: { name: "HearthGuide", version: "0.1.0" },
  });
  return cached;
}
