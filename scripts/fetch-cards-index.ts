import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ENDPOINTS = {
  en: "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json",
  zh: "https://api.hearthstonejson.com/v1/latest/zhCN/cards.collectible.json",
} as const;

const OUT_FULL = resolve(process.cwd(), "data/cards-collectible.json");
const OUT_INDEX = resolve(process.cwd(), "data/cards-index.json");

// Card types we care about for constructed deckbuilding. Other types
// (HERO, HERO_POWER, ENCHANTMENT, BATTLEGROUND_*, etc.) are dropped.
const ALLOWED_TYPES = new Set(["MINION", "SPELL", "WEAPON", "LOCATION"]);

type RawCard = {
  id: string;
  dbfId: number;
  name: string;
  text?: string;
  flavor?: string;
  cardClass?: string;
  classes?: string[];
  cost?: number;
  attack?: number;
  health?: number;
  durability?: number;
  armor?: number;
  type?: string;
  set?: string;
  rarity?: string;
  race?: string;
  races?: string[];
  spellSchool?: string;
  mechanics?: string[];
  collectible?: boolean;
  artist?: string;
};

async function fetchLocale(url: string): Promise<RawCard[]> {
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return (await res.json()) as RawCard[];
}

async function main() {
  const [enCards, zhCards] = await Promise.all([
    fetchLocale(ENDPOINTS.en),
    fetchLocale(ENDPOINTS.zh),
  ]);
  console.log(`en collectible: ${enCards.length}, zh collectible: ${zhCards.length}`);

  const zhById = new Map(zhCards.map((c) => [c.id, c]));

  const full = enCards
    .filter((c) => c.type && ALLOWED_TYPES.has(c.type))
    .map((c) => {
      const zh = zhById.get(c.id);
      return {
        id: c.id,
        dbfId: c.dbfId,
        name_en: c.name,
        name_zh: zh?.name ?? c.name,
        text_en: c.text ?? "",
        text_zh: zh?.text ?? "",
        cardClass: c.cardClass ?? "NEUTRAL",
        classes: c.classes ?? (c.cardClass ? [c.cardClass] : []),
        cost: c.cost ?? 0,
        attack: c.attack,
        health: c.health,
        durability: c.durability,
        armor: c.armor,
        type: c.type ?? "MINION",
        set: c.set ?? "",
        rarity: c.rarity ?? "COMMON",
        race: c.race,
        races: c.races,
        spellSchool: c.spellSchool,
        mechanics: c.mechanics ?? [],
        artist: c.artist,
      };
    });

  // Slim index for /cards list page. Drops long text/mechanics/flavor.
  const index = full.map((c) => ({
    id: c.id,
    dbfId: c.dbfId,
    name_en: c.name_en,
    name_zh: c.name_zh,
    cardClass: c.cardClass,
    classes: c.classes,
    cost: c.cost,
    attack: c.attack,
    health: c.health,
    durability: c.durability,
    type: c.type,
    set: c.set,
    rarity: c.rarity,
  }));

  mkdirSync(dirname(OUT_FULL), { recursive: true });
  writeFileSync(OUT_FULL, JSON.stringify(full, null, 0));
  writeFileSync(OUT_INDEX, JSON.stringify(index, null, 0));
  console.log(
    `Wrote ${OUT_FULL} (${(JSON.stringify(full).length / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `Wrote ${OUT_INDEX} (${(JSON.stringify(index).length / 1024).toFixed(1)} KB)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
