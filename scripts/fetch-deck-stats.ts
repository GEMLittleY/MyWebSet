/**
 * Pulls matchup + mulligan tables for each curated deck from hsguru.com and
 * writes them back into data/decks-raw.json so the next seed-decks run lands
 * the stats in Supabase.
 *
 * Usage:
 *   npx tsx scripts/fetch-deck-stats.ts
 *
 * Required env:
 *   HTTPS_PROXY=http://127.0.0.1:7890   (mainland China users)
 *
 * The selectors below mirror the current hsguru deck page (Stimulus-based);
 * if the markup shifts, update SELECTORS and re-run.
 *
 * NOTE: This is the scaffolding — concrete selectors must be confirmed once
 *       we have a stable connection to hsguru deck pages. The script logs a
 *       summary and never overwrites existing data on parse failure.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type MetaDeck = {
  game_mode: "standard" | "wild";
  archetype_en: string;
  deck_code: string;
  win_rate: number;
  total_games: number;
  source_url: string;
};

type Meta = {
  source: string;
  snapshot_at: string;
  decks: MetaDeck[];
};

type Mulligan = {
  card_id: string;
  name: string;
  keep_rate: number;
  win_rate_kept?: number;
  win_rate_not_kept?: number;
};

type DeckRaw = {
  slug: string;
  source_url: string;
  matchups?: Record<string, number>;
  mulligan?: Mulligan[];
  [key: string]: unknown;
};

const META_PATH = resolve(process.cwd(), "data/meta-candidates.json");
const RAW_PATH = resolve(process.cwd(), "data/decks-raw.json");

async function fetchDeckPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.6",
      },
    });
    if (!res.ok) {
      console.warn(`HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`Failed to fetch ${url}: ${(err as Error).message}`);
    return null;
  }
}

// TODO(p1.3): hsguru renders stats via Phoenix LiveView; on initial HTML the
// matchup + mulligan tables are server-rendered with stable data-* hooks.
// Once we can confirm them, regex them out here. For now this is a no-op
// placeholder so the pipeline doesn't lose data we already have.
function parseStats(html: string): {
  matchups: Record<string, number>;
  mulligan: Mulligan[];
} {
  void html;
  return { matchups: {}, mulligan: [] };
}

async function main() {
  let meta: Meta;
  let decksRaw: DeckRaw[];
  try {
    meta = JSON.parse(readFileSync(META_PATH, "utf-8")) as Meta;
    decksRaw = JSON.parse(readFileSync(RAW_PATH, "utf-8")) as DeckRaw[];
  } catch (err) {
    console.error(`Could not load source data: ${(err as Error).message}`);
    process.exit(1);
  }

  let updated = 0;
  for (const m of meta.decks) {
    const target = decksRaw.find((d) => d.source_url === m.source_url);
    if (!target) continue;

    console.log(`Fetching ${target.source_url}`);
    const html = await fetchDeckPage(target.source_url);
    if (!html) continue;

    const { matchups, mulligan } = parseStats(html);
    if (Object.keys(matchups).length > 0) {
      target.matchups = matchups;
      updated++;
    }
    if (mulligan.length > 0) {
      target.mulligan = mulligan;
      updated++;
    }
  }

  writeFileSync(RAW_PATH, JSON.stringify(decksRaw, null, 2));
  console.log(`Updated ${updated} stat sets. Re-run scripts/seed-decks.ts to push to Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
