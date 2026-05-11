// Validate that every card in data/decks-raw.json resolves cleanly against
// data/cards-zhCN.json (HearthstoneJSON). Run after build-decks-from-meta.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type IndexedCard = {
  id: string;
  dbfId: number;
  name: string;
  cardClass?: string;
  cost?: number;
};

type RawCard = { name: string; id: string; cost: number; count: number };
type RawDeck = { title_en: string; card_list: RawCard[] };

const INDEX_PATH = resolve(process.cwd(), "data/cards-zhCN.json");
const DECKS_PATH = resolve(process.cwd(), "data/decks-raw.json");

if (!existsSync(INDEX_PATH) || !existsSync(DECKS_PATH)) {
  console.error("Missing data/cards-zhCN.json or data/decks-raw.json.");
  process.exit(1);
}

const cards = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as IndexedCard[];
const decks = JSON.parse(readFileSync(DECKS_PATH, "utf8")) as RawDeck[];

const byName = new Map<string, IndexedCard[]>();
const byId = new Map<string, IndexedCard>();
for (const c of cards) {
  if (!byName.has(c.name)) byName.set(c.name, []);
  byName.get(c.name)!.push(c);
  byId.set(c.id, c);
}

let totalCards = 0;
let nameUnknown = 0;
let idMismatch = 0;
let exactOk = 0;

const report: Array<{
  deck: string;
  card: string;
  cost: number;
  current_id?: string;
  status: string;
  suggestion?: string;
}> = [];

for (const deck of decks) {
  for (const card of deck.card_list) {
    totalCards++;
    const matches = byName.get(card.name) || [];
    if (matches.length === 0) {
      nameUnknown++;
      report.push({
        deck: deck.title_en,
        card: card.name,
        cost: card.cost,
        current_id: card.id,
        status: "NAME_UNKNOWN",
      });
      continue;
    }

    if (byId.has(card.id)) {
      const real = byId.get(card.id)!;
      if (real.name === card.name) {
        exactOk++;
        continue;
      }
      idMismatch++;
      report.push({
        deck: deck.title_en,
        card: card.name,
        cost: card.cost,
        current_id: card.id,
        status: "ID_NAME_MISMATCH",
        suggestion: matches.map((c) => c.id).join("|"),
      });
      continue;
    }

    idMismatch++;
    report.push({
      deck: deck.title_en,
      card: card.name,
      cost: card.cost,
      current_id: card.id,
      status: "ID_NOT_EXIST",
      suggestion: matches.map((c) => c.id).join("|"),
    });
  }
}

console.log("=== Validation Summary ===");
console.log(`Total cards across ${decks.length} decks: ${totalCards}`);
console.log(`OK (id+name match): ${exactOk}`);
console.log(`ID exists but name doesn't match: ${idMismatch}`);
console.log(`Name not in HearthstoneJSON: ${nameUnknown}`);
console.log("");

if (report.length > 0) {
  console.log("=== Issues ===");
  for (const r of report) {
    console.log(
      `[${r.status}] "${r.deck}" / ${r.card} (${r.cost}费)` +
        (r.current_id ? ` cur=${r.current_id}` : "") +
        (r.suggestion ? ` => ${r.suggestion}` : ""),
    );
  }
  process.exit(1);
}
