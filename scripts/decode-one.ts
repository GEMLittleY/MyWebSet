import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeDeckstring } from "./lib/deckstring";

const code = process.argv[2];
if (!code) {
  console.error("Usage: tsx scripts/decode-one.ts <deckcode>");
  process.exit(1);
}

const cards = JSON.parse(
  readFileSync(resolve(process.cwd(), "data/cards-zhCN.json"), "utf8"),
) as Array<{ id: string; dbfId: number; name: string; cost?: number; rarity?: string; cardClass?: string }>;
const byDbf = new Map(cards.map((c) => [c.dbfId, c]));

const decoded = decodeDeckstring(code);
console.log("Format:", decoded.format === 2 ? "Standard" : decoded.format === 1 ? "Wild" : decoded.format);
const heroNames = decoded.heroes.map((h) => byDbf.get(h)?.name ?? `??${h}`);
console.log("Heroes:", heroNames);
console.log("Total:", decoded.cards.reduce((s, c) => s + c.count, 0), "cards");
const list = decoded.cards
  .map((c) => {
    const card = byDbf.get(c.dbfId);
    return {
      cost: card?.cost ?? 0,
      name: card?.name ?? `??${c.dbfId}`,
      id: card?.id ?? "?",
      count: c.count,
    };
  })
  .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
for (const c of list) {
  console.log(`  ${c.cost}费 ${c.name.padEnd(18)} x${c.count} [${c.id}]`);
}
