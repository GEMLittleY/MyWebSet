// Build data/decks-raw.json from data/meta-candidates.json.
// Pipeline: decode deck_code -> lookup cards-zhCN -> infer hero_class
// -> compute dust + tier -> map archetype -> write JSON.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeDeckstring } from "./lib/deckstring";

type CardIndex = {
  id: string;
  dbfId: number;
  name: string;
  cardClass?: string;
  cost?: number;
  type?: string;
  set?: string;
  rarity?: string;
};

type MetaCandidate = {
  game_mode: "standard" | "wild";
  archetype_en: string;
  deck_code: string;
  win_rate: number;
  total_games: number;
  source_url: string;
};

type MetaFile = {
  source: string;
  snapshot_at: string;
  filters: Record<string, string>;
  decks: MetaCandidate[];
};

type RawCard = {
  name: string;
  id: string;
  cost: number;
  count: number;
  rarity?: string;
  type?: string;
};

type RawDeck = {
  url: string;
  hero_class: string;
  hero_class_zh: string;
  game_mode: "standard" | "wild";
  title_en: string;
  archetype: string;
  archetype_label: string;
  tier: number;
  win_rate: number;
  total_games: number;
  deck_code: string;
  format: number;
  dust_cost: number;
  card_list: RawCard[];
  source_url: string;
  snapshot_at: string;
};

const HERO_CLASS_FROM_CARDCLASS: Record<string, string> = {
  WARRIOR: "warrior",
  MAGE: "mage",
  HUNTER: "hunter",
  PALADIN: "paladin",
  PRIEST: "priest",
  ROGUE: "rogue",
  SHAMAN: "shaman",
  WARLOCK: "warlock",
  DRUID: "druid",
  DEMONHUNTER: "demon-hunter",
  DEATHKNIGHT: "death-knight",
};

const HERO_CLASS_ZH: Record<string, string> = {
  warrior: "战士",
  mage: "法师",
  hunter: "猎人",
  paladin: "圣骑士",
  priest: "牧师",
  rogue: "潜行者",
  shaman: "萨满",
  warlock: "术士",
  druid: "德鲁伊",
  "demon-hunter": "恶魔猎手",
  "death-knight": "死亡骑士",
};

const ARCHETYPE_MAP: Record<string, { slug: string; label_zh: string }> = {
  "No Minion DH": { slug: "combo", label_zh: "无随从恶魔猎手" },
  "No Hand Hunter": { slug: "combo", label_zh: "空手猎人" },
  "Dragon Warrior": { slug: "midrange", label_zh: "巨龙战士" },
  "Harold Rogue": { slug: "combo", label_zh: "哈罗德潜行者" },
  "Quest Mage": { slug: "combo", label_zh: "任务法师" },
  Discolock: { slug: "combo", label_zh: "迪斯科术士" },
  "777 Miracle Rogue": { slug: "combo", label_zh: "777 奇迹贼" },
  Boarlock: { slug: "aggro", label_zh: "野猪术（猪术）" },
  "XL HL Exodia Mage": { slug: "combo", label_zh: "大型高地无双法师" },
  "XL HL Igneous Warrior": { slug: "control", label_zh: "大型高地火焰战士" },
  "XL HL Tog Druid": { slug: "control", label_zh: "大型高地饕餮德" },
  "Quasar Rogue": { slug: "combo", label_zh: "类星体潜行者" },
};

const DUST_BY_RARITY: Record<string, number> = {
  FREE: 0,
  COMMON: 40,
  RARE: 100,
  EPIC: 400,
  LEGENDARY: 1600,
};

function tierFromWinrate(wr: number): number {
  if (wr >= 56) return 1;
  if (wr >= 53) return 2;
  if (wr >= 51) return 3;
  return 4;
}

function main() {
  const cardsPath = resolve(process.cwd(), "data/cards-zhCN.json");
  const metaPath = resolve(process.cwd(), "data/meta-candidates.json");
  const outPath = resolve(process.cwd(), "data/decks-raw.json");

  if (!existsSync(cardsPath)) {
    console.error(`${cardsPath} not found. Run 'npm run cards:fetch' first.`);
    process.exit(1);
  }
  if (!existsSync(metaPath)) {
    console.error(`${metaPath} not found.`);
    process.exit(1);
  }

  const cards = JSON.parse(readFileSync(cardsPath, "utf8")) as CardIndex[];
  const byDbf = new Map<number, CardIndex>(cards.map((c) => [c.dbfId, c]));
  const meta = JSON.parse(readFileSync(metaPath, "utf8")) as MetaFile;

  const out: RawDeck[] = [];
  for (const m of meta.decks) {
    const decoded = decodeDeckstring(m.deck_code);
    const heroDbf = decoded.heroes[0];
    const heroCard = heroDbf !== undefined ? byDbf.get(heroDbf) : undefined;
    const cardClass = heroCard?.cardClass ?? "";
    const heroClass = HERO_CLASS_FROM_CARDCLASS[cardClass];
    if (!heroClass) {
      console.error(
        `[${m.archetype_en}] Unknown hero cardClass=${cardClass} (dbf=${heroDbf}, name=${heroCard?.name})`,
      );
      continue;
    }

    const card_list: RawCard[] = [];
    let dust = 0;
    let unresolved = 0;
    for (const dc of decoded.cards) {
      const c = byDbf.get(dc.dbfId);
      if (!c) {
        unresolved++;
        continue;
      }
      card_list.push({
        name: c.name,
        id: c.id,
        cost: c.cost ?? 0,
        count: dc.count,
        rarity: c.rarity,
        type: c.type,
      });
      dust += (DUST_BY_RARITY[c.rarity ?? "COMMON"] ?? 40) * dc.count;
    }
    if (unresolved > 0) {
      console.warn(
        `[${m.archetype_en}] ${unresolved} card(s) unresolved (card index possibly stale)`,
      );
    }

    const archMap = ARCHETYPE_MAP[m.archetype_en] ?? {
      slug: "midrange",
      label_zh: m.archetype_en,
    };

    const totalCount = card_list.reduce((s, c) => s + c.count, 0);
    if (totalCount !== 30) {
      console.warn(`[${m.archetype_en}] expected 30 cards, got ${totalCount}`);
    }

    out.push({
      url: m.source_url,
      hero_class: heroClass,
      hero_class_zh: HERO_CLASS_ZH[heroClass] ?? heroClass,
      game_mode: m.game_mode,
      title_en: m.archetype_en,
      archetype: archMap.slug,
      archetype_label: archMap.label_zh,
      tier: tierFromWinrate(m.win_rate),
      win_rate: m.win_rate,
      total_games: m.total_games,
      deck_code: m.deck_code,
      format: decoded.format,
      dust_cost: dust,
      card_list,
      source_url: m.source_url,
      snapshot_at: meta.snapshot_at,
    });

    console.log(
      `OK ${m.archetype_en.padEnd(24)} ${heroClass.padEnd(13)} ${m.game_mode.padEnd(8)} ${m.win_rate}% (${m.total_games}g) T${tierFromWinrate(m.win_rate)} ${dust}d ${card_list.length} kinds`,
    );
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}: ${out.length} decks`);
}

main();
