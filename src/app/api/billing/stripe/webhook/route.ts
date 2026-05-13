import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { billingConfig } from "@/lib/pro";

// Stripe webhooks must verify against the raw request body, so we
// disable Next.js body parsing by reading the request as text.
export const runtime = "nodejs";

type ProfileUpdate = {
  is_pro: boolean;
  pro_until: string | null;
  billing_provider: "stripe" | null;
  billing_status: string | null;
  stripe_subscription_id?: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findUserIdForCustomer(
  admin: ReturnType<typeof adminClient>,
  customerId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function summarise(sub: Stripe.Subscription): ProfileUpdate {
  // Stripe.Subscription.current_period_end is a Unix epoch in seconds.
  const item = sub.items?.data?.[0];
  // Some Stripe API versions expose `current_period_end` on the subscription
  // object directly, others move it to subscription items; check both.
  const subWithLegacy = sub as Stripe.Subscription & {
    current_period_end?: number | null;
  };
  const itemEnd =
    typeof (item as unknown as { current_period_end?: number | null } | undefined)
      ?.current_period_end === "number"
      ? (item as unknown as { current_period_end: number }).current_period_end
      : null;
  const periodEnd = subWithLegacy.current_period_end ?? itemEnd;
  const isPro =
    sub.status === "active" ||
    sub.status === "trialing" ||
    (sub.status === "past_due" && Boolean(periodEnd && periodEnd * 1000 > Date.now()));
  return {
    is_pro: isPro,
    pro_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    billing_provider: "stripe",
    billing_status: sub.status,
    stripe_subscription_id: sub.id,
  };
}

async function applyUpdate(
  admin: ReturnType<typeof adminClient>,
  userId: string,
  patch: ProfileUpdate,
): Promise<void> {
  await admin.from("profiles").update(patch).eq("id", userId);
}

export async function POST(request: Request) {
  const cfg = billingConfig();
  const stripe = getStripe();
  if (!stripe || !cfg.stripe.webhookSecret) {
    return NextResponse.json(
      { error: "billing_not_configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("missing signature", { status: 400 });
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      signature,
      cfg.stripe.webhookSecret,
    );
  } catch (err) {
    return new NextResponse(
      `invalid signature: ${err instanceof Error ? err.message : "unknown"}`,
      { status: 400 },
    );
  }

  const admin = adminClient();

  // Idempotency: skip if we've already processed this Stripe event id.
  const dedupe = await admin
    .from("billing_events")
    .select("id")
    .eq("provider", "stripe")
    .eq("event_id", event.id)
    .maybeSingle();
  if (dedupe.data) return NextResponse.json({ ok: true, duplicate: true });

  let userId: string | null = null;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object as Stripe.Checkout.Session;
        userId =
          (sess.metadata?.user_id as string | undefined) ??
          (sess.customer
            ? await findUserIdForCustomer(admin, sess.customer as string)
            : null);
        if (userId && sess.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            sess.subscription as string,
          );
          await applyUpdate(admin, userId, summarise(sub));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        userId =
          (sub.metadata?.user_id as string | undefined) ??
          (sub.customer
            ? await findUserIdForCustomer(admin, sub.customer as string)
            : null);
        if (userId) await applyUpdate(admin, userId, summarise(sub));
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        userId =
          (sub.metadata?.user_id as string | undefined) ??
          (sub.customer
            ? await findUserIdForCustomer(admin, sub.customer as string)
            : null);
        if (userId) {
          await applyUpdate(admin, userId, {
            is_pro: false,
            pro_until: null,
            billing_provider: null,
            billing_status: "canceled",
            stripe_subscription_id: null,
          });
        }
        break;
      }
      default:
        // Other events are recorded but don't mutate state.
        break;
    }

    await admin.from("billing_events").insert({
      provider: "stripe",
      event_id: event.id,
      event_type: event.type,
      user_id: userId,
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "handler_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
