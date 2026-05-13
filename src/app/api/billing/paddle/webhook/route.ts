import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { billingConfig } from "@/lib/pro";

// Paddle Billing webhooks: HMAC-SHA256 signature in the
// `Paddle-Signature` header. Format: `ts=<unix>;h1=<hmac>`.
//
// We verify exactly as documented at:
// https://developer.paddle.com/webhooks/signature-verification
export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function verifySignature(
  raw: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const idx = kv.indexOf("=");
      return idx === -1
        ? [kv, ""]
        : [kv.slice(0, idx), kv.slice(idx + 1)];
    }),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${raw}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(h1));
}

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string;
    custom_data?: Record<string, unknown> | null;
    current_billing_period?: { ends_at?: string };
    canceled_at?: string;
    items?: Array<{ price?: { id?: string } }>;
  };
};

export async function POST(request: Request) {
  const cfg = billingConfig();
  if (!cfg.paddle.webhookSecret) {
    return NextResponse.json(
      { error: "paddle_not_configured" },
      { status: 503 },
    );
  }

  const raw = await request.text();
  const ok = verifySignature(
    raw,
    request.headers.get("paddle-signature"),
    cfg.paddle.webhookSecret,
  );
  if (!ok) return new NextResponse("invalid signature", { status: 400 });

  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return new NextResponse("invalid json", { status: 400 });
  }
  const evtId = event.event_id ?? `${Date.now()}`;
  const evtType = event.event_type ?? "unknown";

  const admin = adminClient();
  const dedupe = await admin
    .from("billing_events")
    .select("id")
    .eq("provider", "paddle")
    .eq("event_id", evtId)
    .maybeSingle();
  if (dedupe.data) return NextResponse.json({ ok: true, duplicate: true });

  const customData = event.data?.custom_data ?? null;
  const userIdFromMeta =
    typeof customData?.user_id === "string"
      ? (customData.user_id as string)
      : null;
  let userId: string | null = userIdFromMeta;

  // Try resolving by paddle_subscription_id when metadata was lost
  if (!userId && event.data?.id) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("paddle_subscription_id", event.data.id)
      .maybeSingle();
    userId = (data?.id as string | undefined) ?? null;
  }

  if (userId && event.data) {
    const status = event.data.status ?? null;
    const endsAt = event.data.current_billing_period?.ends_at ?? null;
    const isPro =
      status === "active" ||
      status === "trialing" ||
      (status === "past_due" && Boolean(endsAt && Date.parse(endsAt) > Date.now()));
    const canceled =
      evtType === "subscription.canceled" ||
      status === "canceled" ||
      status === "expired";
    if (canceled) {
      await admin
        .from("profiles")
        .update({
          is_pro: false,
          pro_until: null,
          billing_provider: null,
          billing_status: "canceled",
          paddle_subscription_id: null,
        })
        .eq("id", userId);
    } else {
      await admin
        .from("profiles")
        .update({
          is_pro: isPro,
          pro_until: endsAt,
          billing_provider: "paddle",
          billing_status: status,
          paddle_subscription_id: event.data.id ?? null,
        })
        .eq("id", userId);
    }
  }

  await admin.from("billing_events").insert({
    provider: "paddle",
    event_id: evtId,
    event_type: evtType,
    user_id: userId,
    payload: event as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
