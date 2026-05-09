import { supabase } from "./supabase";


export type Card = {
  name: string;
  cost: number;
  count: number;
  card_id?: string;
};

export type Deck = {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  hero_class: string;
  archetype: string;
  deck_code: string;
  dust_cost: number;
  tier: number;
  win_rate: number;
  guide: string;
  card_list: Card[];
  matchups: Record<string, number>;
  published_at: string;
  created_at: string;
};

const DEMO_DECKS: Deck[] = [
  {
    id: 1, title: "海盗快攻战", title_en: "Pirate Aggro Warrior", slug: "pirate-aggro-warrior",
    hero_class: "warrior", archetype: "aggro", deck_code: "AAECAQcGvAOvBJEG...", dust_cost: 4800, tier: 1, win_rate: 56.2,
    guide: "## 卡组思路\n\n快速抢血，前5回合定胜负。起手找1费随从铺场，配合武器和buff快速压低对手血线。\n\n## 留牌\n\n- 所有1费随从\n- 南海船长\n- 恩佐斯的副官（必留）\n\n## 关键回合\n\n- **1-2费**：铺1费海盗，装备武器\n- **3费**：南海船长 buff 全场海盗\n- **4-5费**：英勇打击斩杀\n\n## 替换方案\n\n| 卡牌 | 替换 |\n|------|------|\n| 吵吵机器人 | 恐狼前锋 |\n| 血帆火枪手 | 鹦鹉 |",
    card_list: [
      { name: "恩佐斯的副官", cost: 1, count: 2, card_id: "OG_312" },
      { name: "南海水手", cost: 1, count: 2, card_id: "CS2_146" },
      { name: "升级", cost: 1, count: 2, card_id: "EX1_409" },
      { name: "血帆袭击者", cost: 2, count: 2, card_id: "NEW1_018" },
      { name: "英勇打击", cost: 2, count: 2, card_id: "CS2_105" },
      { name: "南海船长", cost: 3, count: 2, card_id: "NEW1_027" },
      { name: "暴乱狂战士", cost: 3, count: 2, card_id: "EX1_604" },
      { name: "恐怖海盗", cost: 1, count: 2, card_id: "NEW1_022" },
      { name: "炽炎战斧", cost: 3, count: 2, card_id: "OG_315" },
      { name: "吵吵机器人", cost: 4, count: 2, card_id: "GVG_085" },
    ],
    matchups: { hunter: 55, mage: 48, paladin: 60, priest: 62, rogue: 52, shaman: 58, warlock: 54, warrior: 45, druid: 57 },
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 2, title: "冰冻法师", title_en: "Freeze Mage", slug: "freeze-mage",
    hero_class: "mage", archetype: "combo", deck_code: "AAECAf0EBHHE+wKW...", dust_cost: 8200, tier: 2, win_rate: 53.8,
    guide: "## 卡组思路\n\n拖延到后期，利用冰冻法术控制场面，积攒法术伤害后一波爆发带走对手。\n\n## 核心组合\n\n- 大法师安东尼达斯 + 低费法术 = 无限火球\n- 寒冰箭 + 冰枪术 = 高效斩杀\n\n## 留牌\n\n- 奥术智慧（必留）\n- 寒冰箭（对快攻留）\n- 末日预言者（对铺场留）\n\n## 对局要点\n\n| 对手 | 策略 |\n|------|------|\n| 快攻 | 优先清场续命 |\n| 控制 | 积攒伤害一波带走 |\n| 中速 | 合理使用冰冻拖延 |",
    card_list: [
      { name: "冰枪术", cost: 1, count: 2, card_id: "CS2_031" },
      { name: "寒冰箭", cost: 2, count: 2, card_id: "CS2_024" },
      { name: "末日预言者", cost: 2, count: 1, card_id: "NEW1_021" },
      { name: "奥术智慧", cost: 3, count: 2, card_id: "CS2_023" },
      { name: "寒冰屏障", cost: 3, count: 2, card_id: "EX1_295" },
      { name: "冰霜新星", cost: 3, count: 2, card_id: "CS2_026" },
      { name: "火球术", cost: 4, count: 2, card_id: "CS2_029" },
      { name: "暴风雪", cost: 6, count: 2, card_id: "CS2_028" },
      { name: "烈焰风暴", cost: 7, count: 2, card_id: "CS2_032" },
      { name: "大法师安东尼达斯", cost: 7, count: 1, card_id: "EX1_559" },
    ],
    matchups: { hunter: 42, mage: 50, paladin: 55, priest: 60, rogue: 48, shaman: 45, warlock: 58, warrior: 35, druid: 52 },
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 3, title: "奶骑", title_en: "Control Paladin", slug: "control-paladin",
    hero_class: "paladin", archetype: "control", deck_code: "AAECAZ8FCIoB+gHc...", dust_cost: 9600, tier: 2, win_rate: 54.1,
    guide: "## 卡组思路\n\n通过强力治疗和解场控制局面，后期靠提里奥等高质量随从取胜。核心是活到后期，用平等+奉献清场。\n\n## 核心卡牌\n\n- **提里奥·弗丁**：终极后期威胁\n- **平等+奉献**：标志性清场组合\n- **圣疗术**：大量回复续命\n\n## 留牌\n\n- 公正之剑（对快攻必留）\n- 平等（对铺场职业留）\n- 奉献（对快攻留）\n\n## 替换方案\n\n| 卡牌 | 替换 |\n|------|------|\n| 提里奥·弗丁 | 银色指挥官 |\n| 圣疗术 | 圣光术 |",
    card_list: [
      { name: "力量祝福", cost: 1, count: 2, card_id: "CS2_087" },
      { name: "公正之剑", cost: 1, count: 2, card_id: "CS2_091" },
      { name: "平等", cost: 2, count: 2, card_id: "EX1_619" },
      { name: "奉献", cost: 4, count: 2, card_id: "CS2_093" },
      { name: "真银圣剑", cost: 4, count: 2, card_id: "CS2_097" },
      { name: "保卫者", cost: 5, count: 2, card_id: "EX1_366" },
      { name: "圣疗术", cost: 6, count: 2, card_id: "EX1_354" },
      { name: "提里奥·弗丁", cost: 8, count: 1, card_id: "EX1_383" },
    ],
    matchups: { hunter: 48, mage: 55, paladin: 50, priest: 45, rogue: 52, shaman: 56, warlock: 58, warrior: 60, druid: 53 },
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
];

function enrichWithCardIds(deck: Deck): Deck {
  const hasCardIds = deck.card_list?.some((c) => c.card_id);
  if (hasCardIds) return deck;

  const demo = DEMO_DECKS.find((d) => d.slug === deck.slug);
  if (!demo) return deck;

  return { ...deck, card_list: demo.card_list, guide: demo.guide };
}

export async function getAllDecks(): Promise<Deck[]> {
  if (!supabase) return DEMO_DECKS;
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .order("tier", { ascending: true });
    if (error || !data || data.length === 0) return DEMO_DECKS;
    return data.map(enrichWithCardIds);
  } catch {
    return DEMO_DECKS;
  }
}

export async function getDeckBySlug(slug: string): Promise<Deck | null> {
  if (!supabase) return DEMO_DECKS.find((d) => d.slug === slug) || null;
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return DEMO_DECKS.find((d) => d.slug === slug) || null;
    return enrichWithCardIds(data);
  } catch {
    return DEMO_DECKS.find((d) => d.slug === slug) || null;
  }
}

export async function getDecksByClass(heroClass: string): Promise<Deck[]> {
  const all = await getAllDecks();
  if (heroClass === "all") return all;
  return all.filter((d) => d.hero_class === heroClass);
}
