/**
 * Client-safe card metadata: just types and constants. No fs imports.
 * Keep this module free of Node-only dependencies so it can be bundled into
 * client components (search/browse UIs) without dragging server code along.
 */

export type CardIndexEntry = {
  id: string;
  dbfId: number;
  name_en: string;
  name_zh: string;
  cardClass: string;
  classes: string[];
  cost: number;
  attack?: number;
  health?: number;
  durability?: number;
  type: string;
  set: string;
  rarity: string;
};

export type CardFull = CardIndexEntry & {
  text_en: string;
  text_zh: string;
  armor?: number;
  race?: string;
  races?: string[];
  spellSchool?: string;
  mechanics: string[];
  artist?: string;
};

export const CARD_CLASSES = [
  "DEATHKNIGHT",
  "DEMONHUNTER",
  "DRUID",
  "HUNTER",
  "MAGE",
  "PALADIN",
  "PRIEST",
  "ROGUE",
  "SHAMAN",
  "WARLOCK",
  "WARRIOR",
  "NEUTRAL",
] as const;

export const CARD_RARITIES = [
  "FREE",
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
] as const;

export const CARD_TYPES = ["MINION", "SPELL", "WEAPON", "LOCATION"] as const;

export function deckClassToCardClass(deckClass: string): string {
  return deckClass.replace(/-/g, "").toUpperCase();
}

export function cardClassToDeckClass(cardClass: string): string {
  const lower = cardClass.toLowerCase();
  if (lower === "demonhunter") return "demon-hunter";
  if (lower === "deathknight") return "death-knight";
  return lower;
}
