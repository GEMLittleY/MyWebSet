import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "billing_not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "zh" ? "zh" : "en";

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "no_customer" },
      { status: 400 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url:
      process.env.STRIPE_PORTAL_RETURN_URL ??
      `${SITE_URL}/${lang}/account`,
  });
  return NextResponse.json({ url: session.url });
}
