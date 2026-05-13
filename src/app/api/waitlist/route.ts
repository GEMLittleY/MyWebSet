import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  email?: string;
  source?: string;
  lang?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "not_configured", message: "Waitlist not configured." },
      { status: 503 },
    );
  }

  // Pull the current user, if any, to attribute the row — non-fatal.
  let userId: string | null = null;
  try {
    const userClient = await createServerSupabase();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // anon submission is fine
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from("pro_waitlist").upsert(
    {
      email,
      user_id: userId,
      source: body.source?.slice(0, 60) ?? "pricing",
      lang: body.lang?.slice(0, 8) ?? null,
    },
    { onConflict: "email" },
  );
  if (error) {
    return NextResponse.json(
      { error: "save_failed", message: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
