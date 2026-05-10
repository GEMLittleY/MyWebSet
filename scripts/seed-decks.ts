// Seed Supabase `decks` table from data/decks-raw.json (produced by scrape-decks.ts).
// Falls back to DEMO_DECKS if the raw file isn't present.

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEMO_DECKS, type Deck } from "../src/lib/decks";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

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

const ARCHETYPE_ZH: Record<string, string> = {
  aggro: "快攻",
  midrange: "中速",
  control: "控制",
  combo: "组合",
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

function slugFromUrl(url: string): string {
  const m = url.match(/\/([^/]+)\/?$/);
  if (!m) return url;
  // strip "-N-legend-..-score-X-Y" tail to keep slug stable across reruns
  return m[1]!
    .replace(/-\d+-legend-.+$/, "")
    .replace(/-/g, "-")
    .slice(0, 80);
}

function buildGuide(d: RawDeck): string {
  const archZh = ARCHETYPE_ZH[d.archetype] ?? d.archetype;
  const lines = [
    `## 卡组信息`,
    ``,
    `- **职业**: ${d.hero_class_zh}`,
    `- **流派**: ${d.archetype_label}（${archZh}）`,
    `- **传说战绩**: ${(d.win_rate ?? 50).toFixed(1)}% 胜率 · ${d.total_games || "—"} 局`,
    `- **奥术之尘**: ${d.dust_cost.toLocaleString()}`,
    ``,
    `## 数据来源`,
    ``,
    `本卡组来自 [hearthstone-decks.net](${d.url}) 玩家提交的传说前 500 名实战记录。`,
    ``,
    `## 卡组分享码`,
    ``,
    "```",
    d.deck_code,
    "```",
    ``,
    `> 复制以上代码后，在炉石客户端"我的卡组"中点击"新建卡组" → "粘贴卡组"即可导入。`,
  ];
  return lines.join("\n");
}

function buildTitle(d: RawDeck): string {
  return `${d.archetype_label} ${d.hero_class_zh}`;
}

function loadDecks(): Array<Omit<Deck, "id">> {
  const rawPath = resolve(process.cwd(), "data/decks-raw.json");
  if (!existsSync(rawPath)) {
    console.log("data/decks-raw.json not found, falling back to DEMO_DECKS");
    return DEMO_DECKS.map(({ id: _id, ...rest }) => rest);
  }

  const raws = JSON.parse(readFileSync(rawPath, "utf8")) as RawDeck[];
  console.log(`Loaded ${raws.length} decks from ${rawPath}`);

  const seen = new Set<string>();
  return raws.map((d) => {
    let slug = slugFromUrl(d.url);
    let i = 2;
    while (seen.has(slug)) slug = `${slugFromUrl(d.url)}-${i++}`;
    seen.add(slug);

    return {
      title: buildTitle(d),
      title_en: d.title_en,
      slug,
      hero_class: d.hero_class,
      archetype: d.archetype,
      deck_code: d.deck_code,
      dust_cost: d.dust_cost,
      tier: d.tier,
      win_rate: d.win_rate ?? 50,
      guide: buildGuide(d),
      card_list: d.card_list.map((c) => ({
        name: c.name,
        cost: c.cost,
        count: c.count,
        card_id: c.id,
      })),
      matchups: {},
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  });
}

async function main() {
  const rows = loadDecks();
  console.log("Clearing existing decks...");
  const { error: delErr } = await supabase.from("decks").delete().gte("id", 0);
  if (delErr) {
    console.error("Failed to clear decks:", delErr.message);
    process.exit(1);
  }

  console.log(`Inserting ${rows.length} decks...`);
  const { error: insErr } = await supabase.from("decks").insert(rows);
  if (insErr) {
    console.error("Failed to insert decks:", insErr.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${rows.length} decks`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
