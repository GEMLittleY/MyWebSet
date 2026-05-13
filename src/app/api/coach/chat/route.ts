import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getDeckBySlug } from "@/lib/decks";
import {
  COACH_API_BASE,
  COACH_MODEL,
  clipHistory,
  systemPrompt,
  type CoachContext,
  type CoachLang,
  type Msg,
} from "@/lib/coach-prompt";

// Free tier server-side ceiling: 3 messages per user per UTC day.
// (Pro is unlimited; we'll honour that once billing lands.)
const DAILY_LIMIT = 3;

type Body = {
  messages?: Msg[];
  lang?: string;
  deck_slug?: string;
  rank?: string;
  budget?: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureUnderLimit(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
): Promise<{ ok: boolean; used: number }> {
  const day = todayKey();
  // We persist usage in a JSONB column on profiles to avoid yet another
  // table. Each row counts a single coach call.
  const { data } = await supabase
    .from("profiles")
    .select("id,bio")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return { ok: false, used: DAILY_LIMIT };

  // Track usage in a separate side table for accuracy.
  const { count } = await supabase
    .from("coach_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", `${day}T00:00:00.000Z`);
  const used = count ?? 0;
  return { ok: used < DAILY_LIMIT, used };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "ai_unavailable",
        message:
          "AI coach is not yet configured on this deployment. Set OPENAI_API_KEY to enable.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }
  const lang: CoachLang = body.lang === "zh" ? "zh" : "en";
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const userMessages = incoming.filter(
    (m) => m && (m.role === "user" || m.role === "assistant"),
  );
  if (userMessages.length === 0) {
    return new NextResponse("empty conversation", { status: 400 });
  }

  // Auth (best-effort; we still allow anonymous traffic but at a tighter
  // rate limit via IP if we ever need it — here we require sign-in).
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "not_signed_in", message: "Please sign in to use the coach." },
      { status: 401 },
    );
  }

  const limit = await ensureUnderLimit(supabase, user.id);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          lang === "zh"
            ? `今天已用尽 ${DAILY_LIMIT} 次免费额度，升级到 Pro 即可无限使用。`
            : `You've used today's ${DAILY_LIMIT} free messages. Upgrade to Pro for unlimited coach access.`,
        used: limit.used,
        limit: DAILY_LIMIT,
      },
      { status: 429 },
    );
  }

  // Optionally enrich context from the active deck slug.
  const ctx: CoachContext = {
    rank: body.rank,
    budget: typeof body.budget === "number" ? body.budget : undefined,
  };
  if (body.deck_slug) {
    try {
      const deck = await getDeckBySlug(body.deck_slug);
      if (deck) {
        ctx.deck = {
          slug: deck.slug,
          title: deck.title,
          title_en: deck.title_en,
          hero_class: deck.hero_class,
          archetype: deck.archetype,
          tier: deck.tier,
          win_rate: deck.win_rate,
          dust_cost: deck.dust_cost,
          deck_code: deck.deck_code,
          matchups: deck.matchups ?? undefined,
          card_list: (deck.card_list ?? []).map((c) => ({
            name: c.name,
            count: c.count,
            cost: c.cost,
          })),
        };
      }
    } catch {
      // ignore — coach can still answer without context
    }
  }

  const messages: Msg[] = clipHistory([
    { role: "system", content: systemPrompt(lang, ctx) },
    ...userMessages,
  ]);

  let upstream: Response;
  try {
    upstream = await fetch(`${COACH_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "upstream_unreachable", message: (e as Error).message },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: "upstream_error",
        status: upstream.status,
        message: text.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const payload = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text =
    payload.choices?.[0]?.message?.content?.trim() ??
    (lang === "zh"
      ? "我暂时没有想到合适的回答，请换个说法再试一次。"
      : "I couldn't come up with a useful answer — try rephrasing.");

  // Record one usage row for rate limiting.
  await supabase.from("coach_usage").insert({ user_id: user.id });

  return NextResponse.json({
    text,
    usage: { used: limit.used + 1, limit: DAILY_LIMIT },
  });
}
