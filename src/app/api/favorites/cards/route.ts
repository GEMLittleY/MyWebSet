import { NextResponse } from "next/server";
import { getCardIndex } from "@/lib/cards";

// Used by the favourites page to expand a list of card ids the client only
// knows by `${type}:${id}` keys into displayable summaries (name + class).
// Kept tiny: no extra fields, no images — those are loaded on demand.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const wanted = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (wanted.size === 0) {
    return NextResponse.json({ cards: [] });
  }
  const index = getCardIndex();
  const matched = index
    .filter((c) => wanted.has(c.id))
    .map((c) => ({
      id: c.id,
      name_en: c.name_en,
      name_zh: c.name_zh,
      cardClass: c.cardClass,
    }));
  return NextResponse.json({ cards: matched });
}
