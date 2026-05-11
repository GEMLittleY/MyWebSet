import { supabase } from "./supabase";


export type Card = {
  name: string;
  cost: number;
  count: number;
  card_id?: string;
};

export type MulliganEntry = {
  card_id: string;
  name?: string;
  /** Fraction in [0,1] of replays where this card was kept on opening hand. */
  keep_rate: number;
  /** Optional win-rate when kept / mulliganed away. Both fractions. */
  win_rate_kept?: number;
  win_rate_not_kept?: number;
};

export type Deck = {
  id: number;
  title: string;
  title_en: string;
  slug: string;
  hero_class: string;
  /** "standard" | "wild" — defaults to "standard" if Supabase row lacks it. */
  game_mode?: "standard" | "wild";
  archetype: string;
  deck_code: string;
  dust_cost: number;
  tier: number;
  win_rate: number;
  guide: string;
  card_list: Card[];
  matchups: Record<string, number>;
  /** Mulligan keep / win-rate per card. Optional; empty array means no data. */
  mulligan?: MulliganEntry[];
  published_at: string;
  created_at: string;
};

// All deck content is sourced from hsguru.com replays (see scripts/seed-decks.ts).
// We intentionally do NOT keep a DEMO_DECKS fallback with fabricated guides here;
// if Supabase is unreachable, the UI shows an empty state instead of silently
// rendering invented matchups / 留牌 advice.
const EMPTY_DECKS: Deck[] = [];

export async function getAllDecks(): Promise<Deck[]> {
  if (!supabase) return EMPTY_DECKS;
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .order("tier", { ascending: true });
    if (error || !data) return EMPTY_DECKS;
    return data;
  } catch {
    return EMPTY_DECKS;
  }
}

export async function getDeckBySlug(slug: string): Promise<Deck | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getDecksByClass(heroClass: string): Promise<Deck[]> {
  const all = await getAllDecks();
  if (heroClass === "all") return all;
  return all.filter((d) => d.hero_class === heroClass);
}
