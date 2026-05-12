import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` is set by the originating login page so we can return the user
  // to where they came from. Fall back to the homepage; the lang proxy will
  // redirect `/` to the correct locale.
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Send a generic auth failure to /login (with locale-agnostic landing —
  // the proxy will pick the right /[lang]/login). Admin users will be
  // re-routed to /admin/login by the admin layout if needed.
  const fallback = next.startsWith("/admin")
    ? "/admin/login?error=auth_failed"
    : "/login?error=auth_failed";
  return NextResponse.redirect(`${origin}${fallback}`);
}
