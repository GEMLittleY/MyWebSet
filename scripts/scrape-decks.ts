// Scrape current Top 500 Legend decks (Standard + Wild) from hearthstone-decks.net,
// decode their deckstrings, and emit data/decks-raw.json with full metadata.

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { decodeDeckstring } from "./lib/deckstring";

const SITE = "https://hearthstone-decks.net";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const HERO_CLASSES = [
  { id: "death-knight", standardSlug: "death-knight-standard", wildSlug: "death-knight-wild" },
  { id: "demon-hunter", standardSlug: "demon-hunter", wildSlug: "demon-hunter-wild-decks" },
  { id: "druid", standardSlug: "druid", wildSlug: "druid-wild-decks" },
  { id: "hunter", standardSlug: "hunter", wildSlug: "hunter-wild-decks" },
  { id: "mage", standardSlug: "mage", wildSlug: "mage-wild-decks" },
  { id: "paladin", standardSlug: "paladin", wildSlug: "paladin-wild-decks" },
  { id: "priest", standardSlug: "priest", wildSlug: "priest-wild-decks" },
  { id: "rogue", standardSlug: "rogue", wildSlug: "rogue-wild-decks" },
  { id: "shaman", standardSlug: "shaman", wildSlug: "shaman-wild-decks" },
  { id: "warlock", standardSlug: "warlock", wildSlug: "warlock-wild-decks" },
  { id: "warrior", standardSlug: "warrior", wildSlug: "warrior-wild-decks" },
] as const;

const PER_CLASS_PER_MODE = 2;
const REQUEST_DELAY_MS = 500;

type IndexedCard = {
  id: string;
  dbfId: number;
  name: string;
  cardClass?: string;
  cost?: number;
  type?: string;
  rarity?: string;
};

const cards = JSON.parse(
  readFileSync(resolve(process.cwd(), "data/cards-zhCN.json"), "utf8"),
) as IndexedCard[];
const byDbf = new Map(cards.map((c) => [c.dbfId, c]));

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`${url} HTTP ${res.status}`);
  }
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

type DeckLink = { url: string; title: string };

async function listDecks(modeSlug: string, classSlug: string): Promise<DeckLink[]> {
  const url = `${SITE}/${modeSlug}/${classSlug}/`;
  const html = await fetchHtml(url);
  if (!html) return [];
  const matches = [
    ...html.matchAll(
      /<h3[^>]*>\s*<a[^>]+href="(https:\/\/hearthstone-decks\.net\/[^"]+)"[^>]*>([^<]+)<\/a>\s*<\/h3>/g,
    ),
  ];
  return matches.map((m) => ({
    url: m[1]!,
    title: decodeEntities(m[2]!.trim()),
  }));
}

type DeckPage = {
  url: string;
  rawTitle: string;
  deckCode: string;
  scoreWins?: number;
  scoreLosses?: number;
  totalGames?: number;
  winPct?: number;
};

async function fetchDeckPage(link: DeckLink): Promise<DeckPage | null> {
  const html = await fetchHtml(link.url);
  if (!html) return null;
  const codeMatch = html.match(/<input[^>]+id="Code1"[^>]+value="([^"]+)"/);
  if (!codeMatch) return null;

  const scoreMatch = html.match(/(\d+)\s*[-–]\s*(\d+)\s*\(\s*(\d+(?:\.\d+)?)\s*%\s*over\s*(\d+)\s*games?\)/);
  return {
    url: link.url,
    rawTitle: link.title,
    deckCode: codeMatch[1]!,
    scoreWins: scoreMatch ? Number(scoreMatch[1]) : undefined,
    scoreLosses: scoreMatch ? Number(scoreMatch[2]) : undefined,
    winPct: scoreMatch ? Number(scoreMatch[3]) : undefined,
    totalGames: scoreMatch ? Number(scoreMatch[4]) : undefined,
  };
}

const RARITY_DUST: Record<string, number> = {
  COMMON: 40,
  RARE: 100,
  EPIC: 400,
  LEGENDARY: 1600,
  FREE: 0,
};

// Archetype classification: keyword match first, fall back to mana curve heuristic.
const ARCHETYPE_KEYWORDS: Array<[RegExp, string]> = [
  [/\b(quest|otk|combo|reno|odyn|quasar|imbue|merithra|divergence|hand)\b/i, "combo"],
  [/\b(aggro|token|pirate|face|burn|egg|dude|zoo)\b/i, "aggro"],
  [/\b(control|big|reno|wall|highlander)\b/i, "control"],
  [/\b(midrange|mid|secret|herald|companion|dragon|defense|terran|bbu|unholy)\b/i, "midrange"],
];

function classifyArchetype(label: string, deckCards: Array<{ cost?: number; count: number }>): string {
  for (const [re, archetype] of ARCHETYPE_KEYWORDS) {
    if (re.test(label)) return archetype;
  }
  let totalCost = 0;
  let totalCount = 0;
  for (const c of deckCards) {
    totalCost += (c.cost ?? 0) * c.count;
    totalCount += c.count;
  }
  const avg = totalCount === 0 ? 0 : totalCost / totalCount;
  if (avg < 2.6) return "aggro";
  if (avg < 3.4) return "midrange";
  if (avg < 4.5) return "combo";
  return "control";
}

// Strip "#xxx Legend - <author> (Score: ..)" tail and trailing class name.
function extractArchetypeName(title: string, classId: string): string {
  let s = title.replace(/\s*#\d+\s+Legend\s+[-–].*$/i, "").trim();
  const classWord = classId.replace(/-/g, " ");
  const re = new RegExp(`\\s+${classWord.split(" ").join("\\s+")}\\s*$`, "i");
  s = s.replace(re, "").trim();
  return s || "Standard";
}

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

type EnrichedCard = {
  name: string;
  id: string;
  cost: number;
  count: number;
  rarity: string;
  type: string;
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
  card_list: EnrichedCard[];
};

async function scrapeMode(
  mode: "standard" | "wild",
  modeSlug: string,
  out: RawDeck[],
) {
  for (const cls of HERO_CLASSES) {
    const classSlug = mode === "standard" ? cls.standardSlug : cls.wildSlug;
    console.log(`\n[${mode}/${cls.id}] listing ${classSlug}...`);
    const links = await listDecks(modeSlug, classSlug);
    if (links.length === 0) {
      console.log(`  (no entries — slug may not exist)`);
      continue;
    }
    console.log(`  found ${links.length}`);

    const seenArchetype = new Set<string>();
    const picked: DeckLink[] = [];
    for (const l of links) {
      const arch = extractArchetypeName(l.title, cls.id);
      if (seenArchetype.has(arch)) continue;
      seenArchetype.add(arch);
      picked.push(l);
      if (picked.length >= PER_CLASS_PER_MODE) break;
    }

    for (const link of picked) {
      await delay(REQUEST_DELAY_MS);
      console.log(`  -> ${link.title}`);
      try {
        const page = await fetchDeckPage(link);
        if (!page) {
          console.log("     [skip] no deck code");
          continue;
        }

        const decoded = decodeDeckstring(page.deckCode);
        const cardList: EnrichedCard[] = decoded.cards
          .map((c) => {
            const card = byDbf.get(c.dbfId);
            return {
              name: card?.name ?? `??${c.dbfId}`,
              id: card?.id ?? "",
              cost: card?.cost ?? 0,
              count: c.count,
              rarity: card?.rarity ?? "",
              type: card?.type ?? "",
            };
          })
          .filter((c) => c.id !== "")
          .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

        const dustCost = decoded.cards.reduce((sum, c) => {
          const card = byDbf.get(c.dbfId);
          return sum + (RARITY_DUST[card?.rarity ?? ""] ?? 0) * c.count;
        }, 0);

        const archetypeLabel = extractArchetypeName(link.title, cls.id);
        const archetype = classifyArchetype(archetypeLabel, cardList);

        const winRate = page.winPct ?? 50;
        let tier = 3;
        if (winRate >= 58) tier = 1;
        else if (winRate >= 53) tier = 2;

        out.push({
          url: page.url,
          hero_class: cls.id,
          hero_class_zh: HERO_CLASS_ZH[cls.id]!,
          game_mode: mode,
          title_en: archetypeLabel + " " + cls.id.replace(/-/g, " "),
          archetype,
          archetype_label: archetypeLabel,
          tier,
          win_rate: winRate,
          total_games: page.totalGames ?? 0,
          deck_code: page.deckCode,
          format: decoded.format,
          dust_cost: dustCost,
          card_list: cardList,
        });
        console.log(
          `     ✓ ${cardList.reduce((s, c) => s + c.count, 0)} cards · ${dustCost} dust · ${winRate}%/${page.totalGames ?? "?"}局 · ${archetype}`,
        );
      } catch (e) {
        console.log("     [error]", (e as Error).message);
      }
    }
  }
}

async function main() {
  const out: RawDeck[] = [];
  await scrapeMode("standard", "standard-decks", out);
  await scrapeMode("wild", "wild-decks", out);

  const outPath = resolve(process.cwd(), "data/decks-raw.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    `\nWrote ${out.length} decks (standard: ${out.filter((d) => d.game_mode === "standard").length}, wild: ${out.filter((d) => d.game_mode === "wild").length}) to ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
