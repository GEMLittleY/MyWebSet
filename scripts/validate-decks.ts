import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEMO_DECKS } from "../src/lib/decks";

type IndexedCard = {
  id: string;
  dbfId: number;
  name: string;
  cardClass?: string;
  cost?: number;
};

const INDEX_PATH = resolve(process.cwd(), "data/cards-zhCN.json");
const cards = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as IndexedCard[];

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
let idMissing = 0;
let exactOk = 0;

const report: Array<{
  deck: string;
  card: string;
  cost: number;
  current_id?: string;
  status: string;
  suggestion?: string;
}> = [];

for (const deck of DEMO_DECKS) {
  for (const card of deck.card_list) {
    totalCards++;
    const matches = byName.get(card.name) || [];
    if (matches.length === 0) {
      nameUnknown++;
      report.push({
        deck: deck.title,
        card: card.name,
        cost: card.cost,
        current_id: card.card_id,
        status: "NAME_UNKNOWN",
      });
      continue;
    }

    const sameCost = matches.filter((m) => m.cost === card.cost);
    const candidates = sameCost.length > 0 ? sameCost : matches;

    if (!card.card_id) {
      idMissing++;
      report.push({
        deck: deck.title,
        card: card.name,
        cost: card.cost,
        status: "ID_MISSING",
        suggestion: candidates.map((c) => c.id).join("|"),
      });
      continue;
    }

    if (byId.has(card.card_id)) {
      const real = byId.get(card.card_id)!;
      if (real.name === card.name) {
        exactOk++;
        continue;
      }
      idMismatch++;
      report.push({
        deck: deck.title,
        card: card.name,
        cost: card.cost,
        current_id: card.card_id,
        status: "ID_NAME_MISMATCH",
        suggestion: candidates.map((c) => c.id).join("|"),
      });
      continue;
    }

    idMismatch++;
    report.push({
      deck: deck.title,
      card: card.name,
      cost: card.cost,
      current_id: card.card_id,
      status: "ID_NOT_EXIST",
      suggestion: candidates.map((c) => c.id).join("|"),
    });
  }
}

console.log("=== Validation Summary ===");
console.log(`Total cards in DEMO_DECKS: ${totalCards}`);
console.log(`OK (id+name match): ${exactOk}`);
console.log(`ID missing but name found: ${idMissing}`);
console.log(`ID exists but name doesn't match: ${idMismatch}`);
console.log(`Name not in HearthstoneJSON: ${nameUnknown}`);
console.log("");

if (report.length > 0) {
  console.log("=== Issues (showing all) ===");
  for (const r of report) {
    console.log(
      `[${r.status}] "${r.deck}" / ${r.card} (${r.cost}费)` +
        (r.current_id ? ` cur=${r.current_id}` : "") +
        (r.suggestion ? ` => ${r.suggestion}` : ""),
    );
  }
}
