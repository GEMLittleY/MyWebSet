import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { billingConfig } from "@/lib/pro";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

type Body = { plan?: "monthly" | "annual"; lang?: "en" | "zh" };

export async function POST(request: Request) {
  const cfg = billingConfig();
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "billing_not_configured" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }
  const plan: "monthly" | "annual" =
    body.plan === "annual" ? "annual" : "monthly";
  const lang = body.lang === "zh" ? "zh" : "en";

  const priceId =
    plan === "annual" ? cfg.stripe.priceAnnual : cfg.stripe.priceMonthly;
  if (!priceId) {
    return NextResponse.json(
      { error: "price_not_configured", plan },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  // Re-use a Stripe customer if we already created one for this user.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id,email")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const created = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = created.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    locale: lang === "zh" ? "zh" : "en",
    success_url: `${SITE_URL}/${lang}/account?billing=success`,
    cancel_url: `${SITE_URL}/${lang}/pricing?billing=cancelled`,
    metadata: { user_id: user.id, plan },
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
