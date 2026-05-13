// Pure utilities for computing crafting cost diffs.
// Kept dependency-free so it can run in the client.

export const DUST_COST: Record<string, number> = {
  COMMON: 40,
  RARE: 100,
  EPIC: 400,
  LEGENDARY: 1600,
  FREE: 0,
};

export type DeckCard = {
  /** dbf id is the canonical, language-agnostic key. */
  card_dbf_id: number;
  /** Optional string id (e.g. "EX1_001") — for linking only. */
  card_id?: string;
  count: number;
  /** Resolved on the server when possible. */
  rarity: string;
  name_en: string;
  name_zh: string;
  cost: number;
};

export type DiffRow = DeckCard & {
  owned: number;
  missing: number;
  /** Dust required to craft the missing copies of this card. */
  dust: number;
};

export type DiffResult = {
  rows: DiffRow[];
  totalNeeded: number;
  totalOwned: number;
  totalMissing: number;
  totalDust: number;
};

export function computeDiff(
  deck: DeckCard[],
  owned: ReadonlyMap<number, number>,
): DiffResult {
  let totalNeeded = 0;
  let totalOwned = 0;
  let totalMissing = 0;
  let totalDust = 0;
  const rows: DiffRow[] = deck.map((c) => {
    const haveTotal = owned.get(c.card_dbf_id) ?? 0;
    // Cap "owned applied to this deck" at the deck's needed count so a user
    // who somehow has 3 copies doesn't show -1 missing.
    const have = Math.min(haveTotal, c.count);
    const missing = Math.max(0, c.count - have);
    const dust = (DUST_COST[c.rarity] ?? 0) * missing;
    totalNeeded += c.count;
    totalOwned += have;
    totalMissing += missing;
    totalDust += dust;
    return { ...c, owned: have, missing, dust };
  });
  return { rows, totalNeeded, totalOwned, totalMissing, totalDust };
}
