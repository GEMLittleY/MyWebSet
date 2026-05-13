// Prompt scaffolding for the AI deck coach. Kept dependency-free so it can
// be used both server-side (to call the LLM) and client-side (to derive
// labels / tokens if needed).

export type CoachLang = "en" | "zh";

export type CoachContext = {
  deck?: {
    slug: string;
    title: string;
    title_en: string;
    hero_class: string;
    archetype: string;
    tier: number;
    win_rate: number;
    dust_cost: number;
    deck_code?: string;
    matchups?: Record<string, number>;
    card_list?: Array<{ name?: string; count: number; cost?: number }>;
  };
  rank?: string;
  budget?: number;
};

export const COACH_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const COACH_API_BASE =
  process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
export const COACH_MAX_HISTORY = 20;

export function systemPrompt(lang: CoachLang, ctx: CoachContext): string {
  const persona =
    lang === "zh"
      ? `你是 HearthGuide 站内的炉石传说 AI 教练。一位友好但直击要害的高水平玩家，专长是天梯爬分、卡组优化和对阵选择。回答务必：
- 简洁、可执行（≤ 200 字），不要长篇大论。
- 使用 Markdown 列表展示要点。
- 给出建议时引用具体卡牌名称。
- 不知道答案时直接承认，不要编造。
- 全部使用简体中文回复。`
      : `You are the in-app AI coach for HearthGuide, a Hearthstone climbing companion. Friendly, blunt, expert. You specialise in ladder climbing, deck refinement, and matchup play.

Rules:
- Stay concise and actionable (≤ 200 words).
- Use Markdown lists for steps and bullet points.
- Reference real Hearthstone cards by name when relevant.
- If you don't know something, say so — never invent card names or stats.
- Reply in English unless the user writes in another language.`;

  const deckBlock = ctx.deck
    ? lang === "zh"
      ? `\n\n[卡组背景]\n标题: ${ctx.deck.title} (${ctx.deck.title_en})\n职业: ${ctx.deck.hero_class}, 类型: ${ctx.deck.archetype}\n强度: T${ctx.deck.tier}, 胜率: ${ctx.deck.win_rate}%, 造价: ${ctx.deck.dust_cost} 尘\n${ctx.deck.card_list ? `主要卡牌: ${ctx.deck.card_list.slice(0, 12).map((c) => `${c.name}×${c.count}`).join(", ")}` : ""}${ctx.deck.matchups ? `\n关键对阵 (胜率): ${Object.entries(ctx.deck.matchups).slice(0, 8).map(([k, v]) => `${k} ${v}%`).join(", ")}` : ""}`
      : `\n\n[Active deck context]\nTitle: ${ctx.deck.title_en || ctx.deck.title}\nClass: ${ctx.deck.hero_class}, archetype: ${ctx.deck.archetype}\nTier: ${ctx.deck.tier}, win rate: ${ctx.deck.win_rate}%, dust: ${ctx.deck.dust_cost}\n${ctx.deck.card_list ? `Key cards: ${ctx.deck.card_list.slice(0, 12).map((c) => `${c.name}×${c.count}`).join(", ")}` : ""}${ctx.deck.matchups ? `\nMatchups (win%): ${Object.entries(ctx.deck.matchups).slice(0, 8).map(([k, v]) => `${k} ${v}%`).join(", ")}` : ""}`
    : "";

  const playerBlock =
    ctx.rank || ctx.budget != null
      ? lang === "zh"
        ? `\n\n[玩家信息]${ctx.rank ? `\n段位: ${ctx.rank}` : ""}${ctx.budget != null ? `\n尘预算: ${ctx.budget}` : ""}`
        : `\n\n[Player profile]${ctx.rank ? `\nRank: ${ctx.rank}` : ""}${ctx.budget != null ? `\nDust budget: ${ctx.budget}` : ""}`
      : "";

  return persona + deckBlock + playerBlock;
}

export type Msg = { role: "user" | "assistant" | "system"; content: string };

export function clipHistory(msgs: Msg[], max = COACH_MAX_HISTORY): Msg[] {
  // Always keep the leading system message (if present) then the most recent
  // N user/assistant turns.
  const sys = msgs.find((m) => m.role === "system");
  const turns = msgs.filter((m) => m.role !== "system").slice(-max);
  return sys ? [sys, ...turns] : turns;
}
