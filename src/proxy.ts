import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["en", "zh"] as const;
type Lang = (typeof LANGS)[number];
const DEFAULT_LANG: Lang = "en";

function detectLang(req: NextRequest): Lang {
  const accept = req.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.trim().split(";")[0]!.toLowerCase();
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LANG;
}

function hasLangPrefix(pathname: string): boolean {
  return LANGS.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (hasLangPrefix(pathname)) {
    return NextResponse.next();
  }

  const lang = detectLang(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API routes, admin (single-language back office),
  // auth callbacks, and any path containing a dot (static assets).
  matcher: ["/((?!api|_next|admin|auth|.*\\..*).*)"],
};
