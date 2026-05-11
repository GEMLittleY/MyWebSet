// Seed Supabase `decks` table from data/decks-raw.json
// (produced by scripts/build-decks-from-meta.ts).
//
// Source of truth: hsguru.com Firestone replay statistics.
// We do NOT fabricate any "留牌策略 / 关键回合" guide content; the guide
// markdown only contains real numerical facts + a deep link to the source.

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Deck } from "../src/lib/decks";

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

const ARCHETYPE_ZH: Record<string, string> = {
  aggro: "快攻",
  midrange: "中速",
  control: "控制",
  combo: "组合",
};

const MODE_ZH: Record<string, string> = {
  standard: "标准",
  wild: "狂野",
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
  source_url?: string;
  snapshot_at?: string;
};

function slugFromUrl(url: string, mode: string): string {
  const m = url.match(/\/([^/]+)\/?$/);
  const base = m ? m[1]!.replace(/-\d+-legend-.+$/, "") : url;
  return `${mode}-${base}`.slice(0, 80);
}

function buildManaCurve(cards: RawCard[]): string {
  const buckets = Array(8).fill(0);
  for (const c of cards) {
    const idx = Math.min(c.cost, 7);
    buckets[idx] += c.count;
  }
  const max = Math.max(...buckets, 1);
  const labels = ["0", "1", "2", "3", "4", "5", "6", "7+"];
  return buckets
    .map((n, i) => {
      const bar = "█".repeat(Math.round((n / max) * 8));
      return `${labels[i]}费 ${bar.padEnd(8)} ${n}`;
    })
    .join("\n");
}

function buildKeyCards(cards: RawCard[]): string {
  const legendaries = cards.filter((c) => c.rarity === "LEGENDARY");
  const epics = cards.filter((c) => c.rarity === "EPIC");
  const lines: string[] = [];
  if (legendaries.length > 0) {
    lines.push(`**传说卡牌（${legendaries.length}）**：${legendaries.map((c) => c.name).join("、")}`);
  }
  if (epics.length > 0) {
    lines.push(
      `**史诗卡牌（${epics.length}）**：${epics.map((c) => `${c.name}×${c.count}`).join("、")}`,
    );
  }
  return lines.length > 0 ? lines.join("\n\n") : "本卡组无传说/史诗核心卡。";
}

function buildGuide(d: RawDeck): string {
  const archZh = ARCHETYPE_ZH[d.archetype] ?? d.archetype;
  const modeZh = MODE_ZH[d.game_mode] ?? d.game_mode;

  let totalCost = 0;
  let totalCount = 0;
  for (const c of d.card_list) {
    totalCost += c.cost * c.count;
    totalCount += c.count;
  }
  const avgCost = totalCount > 0 ? (totalCost / totalCount).toFixed(2) : "0";

  const sourceUrl = d.source_url ?? d.url;
  const snapshotAt = d.snapshot_at ?? new Date().toISOString().slice(0, 10);

  const lines = [
    `## 卡组信息`,
    ``,
    `| | |`,
    `|---|---|`,
    `| 模式 | ${modeZh}（${d.game_mode}）|`,
    `| 职业 | ${d.hero_class_zh} |`,
    `| 流派 | ${d.archetype_label}（${archZh}）|`,
    `| 平均费用 | ${avgCost} |`,
    `| 实战胜率 | **${(d.win_rate ?? 50).toFixed(1)}%**（${d.total_games?.toLocaleString() || "—"} 局）|`,
    `| 合成尘埃 | ${d.dust_cost.toLocaleString()} |`,
    ``,
    `## 核心卡牌`,
    ``,
    buildKeyCards(d.card_list),
    ``,
    `## 费用曲线`,
    ``,
    "```",
    buildManaCurve(d.card_list),
    "```",
    ``,
    `## 数据来源`,
    ``,
    `本卡组数据来自 [hsguru.com](${sourceUrl})（基于 Firestone 卡牌追踪器上传的真实对局回放统计），快照时间 ${snapshotAt}。`,
    ``,
    `**关于打法、起手留牌、对阵策略**：本站不提供编造的攻略文案，请直接参考：`,
    ``,
    `- [原数据页面](${sourceUrl})（含完整对局明细 / 各回合留牌频率）`,
    `- B 站 / YouTube 搜索 archetype 名称「${d.title_en}」观看高分段位实战录像`,
    `- 国服 NGA「炉石传说」版块社区讨论`,
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
    console.error(
      `data/decks-raw.json not found. Run 'npx tsx scripts/build-decks-from-meta.ts' first.`,
    );
    process.exit(1);
  }

  const raws = JSON.parse(readFileSync(rawPath, "utf8")) as RawDeck[];
  console.log(`Loaded ${raws.length} decks from ${rawPath}`);

  const seen = new Set<string>();
  return raws.map((d) => {
    let slug = slugFromUrl(d.url, d.game_mode);
    let i = 2;
    const base = slug;
    while (seen.has(slug)) slug = `${base}-${i++}`;
    seen.add(slug);

    return {
      title: buildTitle(d),
      title_en: d.title_en,
      slug,
      hero_class: d.hero_class,
      game_mode: d.game_mode,
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

  console.log(
    `Successfully seeded ${rows.length} decks (standard: ${rows.filter((r) => r.game_mode === "standard").length}, wild: ${rows.filter((r) => r.game_mode === "wild").length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
