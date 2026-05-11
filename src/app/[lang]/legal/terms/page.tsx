import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "服务条款" : "Terms of Service",
    alternates: {
      canonical: `/${lang}/legal/terms`,
      languages: {
        en: "/en/legal/terms",
        "zh-CN": "/zh/legal/terms",
        "x-default": "/en/legal/terms",
      },
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return lang === "zh" ? <ZhContent /> : <EnContent />;
}

function EnContent() {
  return (
    <article className="prose-like max-w-3xl mx-auto px-6 py-12 text-[#e8e6e3]">
      <h1 className="text-3xl font-bold gold-text mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 12, 2026</p>

      <Section title="1. Acceptance">
        <p>
          By accessing HearthGuide you agree to these Terms. If you do not
          agree, please do not use the Site.
        </p>
      </Section>

      <Section title="2. Not affiliated with Blizzard">
        <p>
          HearthGuide is an unofficial fan site. Hearthstone, all related
          assets, card images and lore are trademarks and copyrights of
          Blizzard Entertainment, Inc. Card images are used under fair use for
          identification and commentary only.
        </p>
      </Section>

      <Section title="3. User content">
        <p>
          If you submit comments, deck variants or other content, you retain
          ownership but grant us a worldwide, royalty-free license to host,
          display, and distribute that content as part of the Site. You may
          not upload content that is unlawful, infringing, hateful, or
          intended to harm others.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>
          You agree not to scrape the Site at scale, attempt to disrupt our
          services, circumvent rate limits, or use automated systems to abuse
          features such as the AI coach.
        </p>
      </Section>

      <Section title="5. Subscriptions">
        <p>
          Paid plans, if available, are billed by our payment processor
          (Stripe or Paddle). Subscriptions renew automatically until you
          cancel. Refunds are handled in accordance with the processor&apos;s
          policy and applicable consumer protection laws.
        </p>
      </Section>

      <Section title="6. Disclaimer">
        <p>
          The Site is provided &ldquo;as is&rdquo;. We do not guarantee that
          decks listed will be winning, that win rates will remain stable, or
          that the Site will be uninterrupted. Use any strategy at your own
          risk.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, HearthGuide and its
          maintainers are not liable for any indirect or consequential
          damages.
        </p>
      </Section>

      <Section title="8. Termination">
        <p>
          We may suspend or terminate accounts that violate these Terms or
          applicable law.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions? Email{" "}
          <code className="text-[#f0b232]">hello@hearthguide.app</code>.
        </p>
      </Section>
    </article>
  );
}

function ZhContent() {
  return (
    <article className="prose-like max-w-3xl mx-auto px-6 py-12 text-[#e8e6e3]">
      <h1 className="text-3xl font-bold gold-text mb-2">服务条款</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新：2026 年 5 月 12 日</p>

      <Section title="1. 接受条款">
        <p>
          访问或使用 HearthGuide 即表示你同意以下条款。若不同意，请勿使用
          本站。
        </p>
      </Section>

      <Section title="2. 非暴雪官方">
        <p>
          HearthGuide 是一个非官方的玩家社区站点。Hearthstone（炉石传说）及其
          所有相关资产、卡牌图片和背景设定是 Blizzard Entertainment, Inc.
          的商标与版权资产。卡牌图片仅作识别与评论用途，属合理使用。
        </p>
      </Section>

      <Section title="3. 用户内容">
        <p>
          你提交的评论、卡组变种或其他内容仍归你所有，但你授权我们以全球、
          免版税的方式在本站托管、展示与分发该内容。请勿上传违法、侵权、
          仇恨或有意伤害他人的内容。
        </p>
      </Section>

      <Section title="4. 合理使用">
        <p>
          请勿大规模爬取本站、扰乱我们的服务、绕过频次限制，或滥用 AI 教练
          等功能。
        </p>
      </Section>

      <Section title="5. 订阅服务">
        <p>
          付费计划（如有）由我们的支付处理方（Stripe 或 Paddle）代收。订阅
          会自动续期直至你主动取消。退款按处理方政策及适用消费者保护法律
          办理。
        </p>
      </Section>

      <Section title="6. 免责声明">
        <p>
          本站按现状提供。我们不保证站内卡组一定胜率高、不保证胜率不发生
          波动、也不保证服务不中断，请自行判断风险。
        </p>
      </Section>

      <Section title="7. 责任限制">
        <p>
          在法律允许的最大范围内，HearthGuide 及其维护者不对任何间接或衍生
          损失承担责任。
        </p>
      </Section>

      <Section title="8. 终止">
        <p>对违反本条款或相关法律的账号，我们有权暂停或注销。</p>
      </Section>

      <Section title="9. 联系">
        <p>
          有疑问？请发送邮件至{" "}
          <code className="text-[#f0b232]">hello@hearthguide.app</code>。
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-semibold text-[#f0b232] mb-2">{title}</h2>
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}
