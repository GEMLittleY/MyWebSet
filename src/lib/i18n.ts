export type Lang = "zh" | "en";

const dict = {
  zh: {
    siteName: "HearthGuide",
    siteDesc: "你的炉石上分伴侣",
    nav: {
      home: "首页",
      decks: "卡组库",
      guides: "攻略",
      meta: "Meta",
      recommend: "AI推荐",
    },
    hero: {
      title: "HearthGuide",
      subtitle: "你的炉石上分伴侣",
      desc: "最新卡组推荐、Meta 分析和上分攻略，助你从青铜到传说。",
      cta: "浏览卡组",
      ctaMeta: "Meta 报告",
    },
    decks: {
      title: "卡组库",
      allClasses: "全部职业",
      allTypes: "全部类型",
      modeStandard: "标准",
      modeWild: "狂野",
      dust: "尘",
      winRate: "胜率",
      tier: "强度",
      copyCode: "复制卡组代码",
      copied: "已复制！",
      guide: "使用攻略",
      matchups: "对阵分析",
      manaCurve: "费用曲线",
      cardList: "卡牌列表",
    },
    guides: {
      title: "攻略文章",
      readMore: "阅读更多 →",
      back: "← 返回列表",
    },
    meta: {
      title: "Meta 报告",
      desc: "当前版本各职业强度排名与环境分析",
      tierList: "Tier List",
    },
    recommend: {
      title: "AI 卡组推荐",
      desc: "告诉我们你的情况，AI 为你推荐最合适的卡组",
      rank: "你的段位",
      preferClass: "偏好职业",
      budget: "尘预算",
      submit: "获取推荐",
      result: "推荐结果",
    },
    classes: {
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
    },
    archetypes: {
      aggro: "快攻",
      midrange: "中速",
      control: "控制",
      combo: "组合技",
    },
    footer: {
      desc: "最全面的炉石传说攻略与卡组数据库",
      rights: "All rights reserved.",
    },
  },
  en: {
    siteName: "HearthGuide",
    siteDesc: "Your Hearthstone Climbing Companion",
    nav: {
      home: "Home",
      decks: "Decks",
      guides: "Guides",
      meta: "Meta",
      recommend: "AI Pick",
    },
    hero: {
      title: "HearthGuide",
      subtitle: "Your Hearthstone Climbing Companion",
      desc: "Best decks, meta reports and strategy guides to help you reach Legend.",
      cta: "Browse Decks",
      ctaMeta: "Meta Report",
    },
    decks: {
      title: "Deck Library",
      allClasses: "All Classes",
      allTypes: "All Types",
      modeStandard: "Standard",
      modeWild: "Wild",
      dust: "Dust",
      winRate: "Win Rate",
      tier: "Tier",
      copyCode: "Copy Deck Code",
      copied: "Copied!",
      guide: "Strategy Guide",
      matchups: "Matchups",
      manaCurve: "Mana Curve",
      cardList: "Card List",
    },
    guides: {
      title: "Strategy Guides",
      readMore: "Read more →",
      back: "← Back to list",
    },
    meta: {
      title: "Meta Report",
      desc: "Current tier rankings and meta analysis",
      tierList: "Tier List",
    },
    recommend: {
      title: "AI Deck Picker",
      desc: "Tell us about your situation and AI will recommend the best decks",
      rank: "Your Rank",
      preferClass: "Preferred Class",
      budget: "Dust Budget",
      submit: "Get Recommendations",
      result: "Recommendations",
    },
    classes: {
      warrior: "Warrior",
      mage: "Mage",
      hunter: "Hunter",
      paladin: "Paladin",
      priest: "Priest",
      rogue: "Rogue",
      shaman: "Shaman",
      warlock: "Warlock",
      druid: "Druid",
      "demon-hunter": "Demon Hunter",
      "death-knight": "Death Knight",
    },
    archetypes: {
      aggro: "Aggro",
      midrange: "Midrange",
      control: "Control",
      combo: "Combo",
    },
    footer: {
      desc: "The most comprehensive Hearthstone deck database & guides",
      rights: "All rights reserved.",
    },
  },
} as const;

export function getDict(lang: Lang) {
  return dict[lang] || dict.zh;
}

export function getLangFromParams(searchParams: { lang?: string }): Lang {
  return searchParams?.lang === "en" ? "en" : "zh";
}
