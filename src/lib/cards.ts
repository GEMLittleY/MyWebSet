import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { CardFull, CardIndexEntry } from "./cards-meta";

export type { CardFull, CardIndexEntry } from "./cards-meta";
export {
  CARD_CLASSES,
  CARD_RARITIES,
  CARD_TYPES,
  cardClassToDeckClass,
  deckClassToCardClass,
} from "./cards-meta";

let indexCache: CardIndexEntry[] | null = null;
let fullCache: Map<string, CardFull> | null = null;

function readJson<T>(rel: string): T {
  const p = path.join(process.cwd(), rel);
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

export function getCardIndex(): CardIndexEntry[] {
  if (indexCache) return indexCache;
  try {
    indexCache = readJson<CardIndexEntry[]>("data/cards-index.json");
  } catch {
    indexCache = [];
  }
  return indexCache;
}

export function getCardById(id: string): CardFull | undefined {
  if (!fullCache) {
    fullCache = new Map();
    try {
      const list = readJson<CardFull[]>("data/cards-collectible.json");
      for (const c of list) fullCache.set(c.id, c);
    } catch {
      // file missing — fall through with empty map
    }
  }
  return fullCache.get(id);
}
