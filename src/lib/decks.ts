import { supabase } from "./supabase";

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
  card_list: { name: string; cost: number; count: number }[];
  matchups: Record<string, number>;
  published_at: string;
  created_at: string;
};

const DEMO_DECKS: Deck[] = [
  {
    id: 1, title: "海盗快攻战", title_en: "Pirate Aggro Warrior", slug: "pirate-aggro-warrior",
    hero_class: "warrior", archetype: "aggro", deck_code: "AAECAQcGvAOvBJEG...", dust_cost: 4800, tier: 1, win_rate: 56.2,
    guide: "## 卡组思路\n\n快速抢血，前5回合定胜负。\n\n## 留牌\n\n- 所有1费随从\n- 南海船长",
    card_list: [{"name":"恩佐斯的副官","cost":1,"count":2},{"name":"南海船长","cost":1,"count":2},{"name":"升级","cost":1,"count":2},{"name":"血帆袭击者","cost":2,"count":2},{"name":"英勇打击","cost":2,"count":2},{"name":"血帆火枪手","cost":3,"count":2},{"name":"暴乱狂战士","cost":3,"count":2},{"name":"吵吵机器人","cost":4,"count":2}],
    matchups: {"hunter":55,"mage":48,"paladin":60,"priest":62,"rogue":52,"shaman":58,"warlock":54,"warrior":45,"druid":57},
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 2, title: "冰冻法师", title_en: "Freeze Mage", slug: "freeze-mage",
    hero_class: "mage", archetype: "combo", deck_code: "AAECAf0EBHHE+wKW...", dust_cost: 8200, tier: 2, win_rate: 53.8,
    guide: "## 卡组思路\n\n拖延到后期，法术爆发一波带走。\n\n## 核心组合\n\n- 大法师 + 低费法术 = 无限火球",
    card_list: [{"name":"奥术智慧","cost":3,"count":2},{"name":"寒冰屏障","cost":3,"count":2},{"name":"暴风雪","cost":6,"count":2},{"name":"火球术","cost":4,"count":2},{"name":"寒冰箭","cost":2,"count":2},{"name":"冰枪术","cost":1,"count":2},{"name":"末日术","cost":7,"count":2},{"name":"大法师安东尼达斯","cost":7,"count":1}],
    matchups: {"hunter":42,"mage":50,"paladin":55,"priest":60,"rogue":48,"shaman":45,"warlock":58,"warrior":35,"druid":52},
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 3, title: "奶骑", title_en: "Control Paladin", slug: "control-paladin",
    hero_class: "paladin", archetype: "control", deck_code: "AAECAZ8FCIoB+gHc...", dust_cost: 9600, tier: 2, win_rate: 54.1,
    guide: "## 卡组思路\n\n通过强力治疗和解场控制局面，后期靠高质量随从取胜。",
    card_list: [{"name":"平等","cost":2,"count":2},{"name":"奉献","cost":4,"count":2},{"name":"圣疗术","cost":6,"count":2},{"name":"力量祝福","cost":1,"count":2},{"name":"提里奥·弗丁","cost":8,"count":1},{"name":"公正之剑","cost":1,"count":2},{"name":"真银圣剑","cost":4,"count":2}],
    matchups: {"hunter":48,"mage":55,"paladin":50,"priest":45,"rogue":52,"shaman":56,"warlock":58,"warrior":60,"druid":53},
    published_at: "2026-05-01T00:00:00Z", created_at: "2026-05-01T00:00:00Z",
  },
];

export async function getAllDecks(): Promise<Deck[]> {
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .order("tier", { ascending: true });
    if (error || !data || data.length === 0) return DEMO_DECKS;
    return data;
  } catch {
    return DEMO_DECKS;
  }
}

export async function getDeckBySlug(slug: string): Promise<Deck | null> {
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return DEMO_DECKS.find((d) => d.slug === slug) || null;
    return data;
  } catch {
    return DEMO_DECKS.find((d) => d.slug === slug) || null;
  }
}

export async function getDecksByClass(heroClass: string): Promise<Deck[]> {
  const all = await getAllDecks();
  if (heroClass === "all") return all;
  return all.filter((d) => d.hero_class === heroClass);
}
