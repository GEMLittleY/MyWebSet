"use client";

import { useState } from "react";
import { PRO_PRICE_USD, PRO_PRICE_USD_ANNUAL } from "@/lib/pro";
import ProBadge from "./ProBadge";
import type { Lang } from "@/lib/i18n";

const COPY = {
  en: {
    headline: "Make HearthGuide your edge.",
    sub: "Pro is coming soon. Join the waitlist and lock in launch pricing.",
    free: "Free",
    pro: "Pro",
    perMonth: "/ month",
    perYear: "/ year",
    free_blurb: "Everything you need to climb. Forever free.",
    pro_blurb: "Power tools for serious players.",
    cta_free: "Current plan",
    cta_pro: "Join waitlist",
    soon: "Coming soon",
    saveLabel: (n: number) => `Save ${n}%`,
    features: {
      free: [
        "Latest meta decks with real win rates",
        "Mulligan & matchup data",
        "AI deck picker by class + budget",
        "Ad-supported",
      ],
      pro: [
        "Everything in Free, plus:",
        "Unlimited AI coach (vs 3/day on Free)",
        "Collection-diff: scan & plan craft order",
        "Advanced meta filters by rank + region",
        "Ad-free experience",
        "Save & share custom deck variants",
        "Early access to new tools",
      ],
    },
    waitlist: "Drop your email and we'll let you know when Pro opens.",
    emailPh: "you@email.com",
    waitlistSent: "Thanks! We'll be in touch.",
    join: "Notify me",
    faqTitle: "FAQ",
    faqs: [
      {
        q: "Will the current free features stay free?",
        a: "Yes. All current functionality stays free forever. Pro only unlocks new advanced tools and removes ads.",
      },
      {
        q: "When does Pro launch?",
        a: "We are aiming for Q3 2026. Waitlist members get a launch discount and first access.",
      },
      {
        q: "How do I cancel?",
        a: "One click in your account page, any time, no questions. You keep Pro access through the end of the current billing period.",
      },
    ],
  },
  zh: {
    headline: "把 HearthGuide 当作上分秘籍。",
    sub: "Pro 即将上线，加入候补名单锁定首发优惠。",
    free: "免费版",
    pro: "Pro 会员",
    perMonth: " / 月",
    perYear: " / 年",
    free_blurb: "上分必备工具，永久免费。",
    pro_blurb: "为认真上分的玩家准备的高级工具。",
    cta_free: "当前方案",
    cta_pro: "加入候补",
    soon: "即将上线",
    saveLabel: (n: number) => `年付立省 ${n}%`,
    features: {
      free: [
        "最新 Meta 卡组，附真实胜率",
        "起手指南与对阵数据",
        "AI 卡组推荐（按职业 + 预算）",
        "带轻量广告",
      ],
      pro: [
        "免费版全部功能，外加：",
        "AI 教练无限次（免费版每天 3 次）",
        "集合差额：扫描你的收藏并给出合成建议",
        "Meta 进阶筛选（按段位 / 地区）",
        "无广告体验",
        "保存并分享自定义卡组变种",
        "新功能抢先体验",
      ],
    },
    waitlist: "留下邮箱，Pro 上线时第一时间通知你。",
    emailPh: "you@email.com",
    waitlistSent: "已收到，我们会通过邮件联系你。",
    join: "通知我",
    faqTitle: "常见问题",
    faqs: [
      {
        q: "现在免费的功能会变成付费吗？",
        a: "不会。当前所有功能将永久免费。Pro 仅解锁新增的高级工具并去除广告。",
      },
      {
        q: "Pro 什么时候上线？",
        a: "目标 2026 年 Q3。候补会员可获得首发折扣并优先体验。",
      },
      {
        q: "怎么取消？",
        a: "账号设置一键取消，无需说明原因。当前付费周期内 Pro 权益保留。",
      },
    ],
  },
} satisfies Record<Lang, unknown>;

export default function PricingContent({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [annual, setAnnual] = useState(true);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const monthEquivalent = annual ? PRO_PRICE_USD_ANNUAL / 12 : PRO_PRICE_USD;
  const savePct = Math.round(
    100 - (PRO_PRICE_USD_ANNUAL / (PRO_PRICE_USD * 12)) * 100,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // P3.3 will POST to /api/waitlist → Supabase table. For now we just
    // simulate locally so the UI works end-to-end.
    if (email.trim()) {
      setSubmitted(true);
      try {
        window.localStorage.setItem("hg_pro_waitlist", email.trim());
      } catch {
        // ignore quota errors
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="text-center mb-12">
        <ProBadge size="md" className="mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold gold-text mb-3">
          {t.headline}
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">{t.sub}</p>
      </header>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setAnnual(false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !annual
              ? "bg-[#f0b232] text-[#0f1419]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {lang === "zh" ? "月付" : "Monthly"}
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            annual
              ? "bg-[#f0b232] text-[#0f1419]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {lang === "zh" ? "年付" : "Annual"}
          <span className="ml-2 text-[10px] uppercase tracking-wide text-[#63d98c]">
            {t.saveLabel(savePct)}
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Plan
          title={t.free}
          blurb={t.free_blurb}
          price="$0"
          per={t.perMonth}
          cta={t.cta_free}
          ctaDisabled
          features={t.features.free}
        />
        <Plan
          title={t.pro}
          blurb={t.pro_blurb}
          price={`$${monthEquivalent.toFixed(2)}`}
          per={annual ? t.perMonth : t.perMonth}
          subPrice={
            annual
              ? `$${PRO_PRICE_USD_ANNUAL}${lang === "zh" ? "（年付）" : " billed annually"}`
              : undefined
          }
          cta={t.cta_pro}
          ctaNote={t.soon}
          highlight
          features={t.features.pro}
        />
      </div>

      {/* Waitlist */}
      <section className="mt-14 max-w-xl mx-auto card p-6 text-center">
        <p className="text-sm text-gray-300 mb-4">{t.waitlist}</p>
        {submitted ? (
          <p className="text-[#63d98c] font-medium">{t.waitlistSent}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              className="flex-1 bg-[#0f1419] border border-[#2a3040] rounded-lg px-4 py-2 text-sm text-[#e8e6e3] placeholder:text-gray-600 focus:outline-none focus:border-[#f0b232]"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold hover:bg-[#d4982a] transition-colors"
            >
              {t.join}
            </button>
          </form>
        )}
      </section>

      {/* FAQ */}
      <section className="mt-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold gold-text mb-5">{t.faqTitle}</h2>
        <div className="space-y-4">
          {t.faqs.map((f) => (
            <details
              key={f.q}
              className="card p-5 group"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-[#e8e6e3] font-medium">
                {f.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Plan({
  title,
  blurb,
  price,
  per,
  subPrice,
  cta,
  ctaDisabled,
  ctaNote,
  features,
  highlight,
}: {
  title: string;
  blurb: string;
  price: string;
  per: string;
  subPrice?: string;
  cta: string;
  ctaDisabled?: boolean;
  ctaNote?: string;
  features: readonly string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`card p-7 flex flex-col ${
        highlight ? "border-[#f0b232]/60 shadow-[0_0_30px_-15px_rgba(240,178,50,0.5)]" : ""
      }`}
    >
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[#e8e6e3]">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{blurb}</p>
      </div>
      <div className="mb-5">
        <span className="text-4xl font-bold text-[#e8e6e3]">{price}</span>
        <span className="text-sm text-gray-500">{per}</span>
        {subPrice && (
          <p className="text-xs text-gray-500 mt-1">{subPrice}</p>
        )}
      </div>
      <ul className="space-y-2.5 text-sm text-gray-300 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="text-[#63d98c] shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={ctaDisabled}
        className={`w-full py-2.5 rounded-lg font-semibold transition-colors ${
          ctaDisabled
            ? "bg-[#1a1f2e] text-gray-500 cursor-default border border-[#2a3040]"
            : highlight
              ? "bg-[#f0b232] text-[#0f1419] hover:bg-[#d4982a]"
              : "bg-[#1a1f2e] text-gray-300 border border-[#2a3040] hover:border-[#f0b232]"
        }`}
      >
        {cta}
      </button>
      {ctaNote && (
        <p className="text-center text-xs text-gray-500 mt-2">{ctaNote}</p>
      )}
    </div>
  );
}
