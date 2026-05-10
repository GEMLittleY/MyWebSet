// Scrape current Top 500 Legend Standard decks from hearthstone-decks.net,
// decode their deckstrings, and emit data/decks-raw.json with full metadata.

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { decodeDeckstring } from "./lib/deckstring";

const SITE = "https://hearthstone-decks.net";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const HERO_CLASSES = [
  { slug: "death-knight-standard", id: "death-knight" },
  { slug: "demon-hunter", id: "demon-hunter" },
  { slug: "druid", id: "druid" },
  { slug: "hunter", id: "hunter" },
  { slug: "mage", id: "mage" },
  { slug: "paladin", id: "paladin" },
  { slug: "priest", id: "priest" },
  { slug: "rogue", id: "rogue" },
  { slug: "shaman", id: "shaman" },
  { slug: "warlock", id: "warlock" },
  { slug: "warrior", id: "warrior" },
] as const;

const PER_CLASS = 2;
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

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
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

async function listDecksByClass(classSlug: string): Promise<DeckLink[]> {
  const url = `${SITE}/standard-decks/${classSlug}/`;
  const html = await fetchHtml(url);
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

function classifyArchetype(deckCards: Array<{ cost?: number; count: number }>): string {
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

// Strip "#xxx Legend - <author> (Score: ..)" tail from title to get archetype.
function extractArchetypeName(title: string, classId: string): string {
  let s = title.replace(/\s*#\d+\s+Legend\s+[-–].*$/i, "").trim();
  // Remove trailing class name (case-insensitive)
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

type RawDeck = {
  url: string;
  hero_class: string;
  hero_class_zh: string;
  title_en: string;
  archetype: string;
  archetype_label: string;
  tier: number;
  win_rate: number;
  total_games: number;
  deck_code: string;
  format: number;
  dust_cost: number;
  card_list: Array<{ name: string; id: string; cost: number; count: number }>;
};

async function main() {
  const out: RawDeck[] = [];
  for (const cls of HERO_CLASSES) {
    console.log(`\n[${cls.id}] listing...`);
    const links = await listDecksByClass(cls.slug);
    console.log(`  found ${links.length} entries`);

    const seenArchetype = new Set<string>();
    const picked: DeckLink[] = [];
    for (const l of links) {
      const arch = extractArchetypeName(l.title, cls.id);
      if (seenArchetype.has(arch)) continue;
      seenArchetype.add(arch);
      picked.push(l);
      if (picked.length >= PER_CLASS) break;
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
        const cardList = decoded.cards
          .map((c) => {
            const card = byDbf.get(c.dbfId);
            return {
              name: card?.name ?? `??${c.dbfId}`,
              id: card?.id ?? "",
              cost: card?.cost ?? 0,
              count: c.count,
            };
          })
          .filter((c) => c.id !== "")
          .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

        const dustCost = decoded.cards.reduce((sum, c) => {
          const card = byDbf.get(c.dbfId);
          return sum + (RARITY_DUST[card?.rarity ?? ""] ?? 0) * c.count;
        }, 0);

        const archetypeLabel = extractArchetypeName(link.title, cls.id);
        const archetype = classifyArchetype(cardList);

        const winRate = page.winPct ?? 50;
        let tier = 3;
        if (winRate >= 58) tier = 1;
        else if (winRate >= 53) tier = 2;

        out.push({
          url: page.url,
          hero_class: cls.id,
          hero_class_zh: HERO_CLASS_ZH[cls.id]!,
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
          `     ✓ ${cardList.reduce((s, c) => s + c.count, 0)} cards, ${dustCost} dust, ${winRate}% over ${page.totalGames}`,
        );
      } catch (e) {
        console.log("     [error]", (e as Error).message);
      }
    }
  }

  const outPath = resolve(process.cwd(), "data/decks-raw.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} decks to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
