import { NextResponse } from "next/server";
import { getCardIndex } from "@/lib/cards";
import { decodeDeckstring } from "@/lib/deckstring-decoder";

// POST body: { code: string }
// Response:  { cards: [{ dbfId, count, rarity }] }
// Used by /account/collection to bulk-mark cards as owned from a pasted
// deck code. We attach rarity so the client can cap legendaries at 1 copy.
export async function POST(request: Request) {
  let code: string;
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code !== "string" || !body.code.trim()) {
      return new NextResponse("missing code", { status: 400 });
    }
    code = body.code.trim();
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }

  let decoded;
  try {
    decoded = decodeDeckstring(code);
  } catch (e) {
    return new NextResponse(
      `decode failed: ${e instanceof Error ? e.message : "unknown"}`,
      { status: 400 },
    );
  }

  const idx = getCardIndex();
  const byDbf = new Map(idx.map((c) => [c.dbfId, c] as const));
  const cards = decoded.cards.map((c) => {
    const meta = byDbf.get(c.dbfId);
    return {
      dbfId: c.dbfId,
      count: c.count,
      rarity: meta?.rarity ?? "COMMON",
    };
  });

  return NextResponse.json({ cards });
}
