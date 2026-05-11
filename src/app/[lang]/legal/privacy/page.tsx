import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "隐私政策" : "Privacy Policy",
    alternates: {
      canonical: `/${lang}/legal/privacy`,
      languages: {
        en: "/en/legal/privacy",
        "zh-CN": "/zh/legal/privacy",
        "x-default": "/en/legal/privacy",
      },
    },
  };
}

export default async function PrivacyPage({
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
      <h1 className="text-3xl font-bold gold-text mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 12, 2026</p>

      <Section title="1. Who we are">
        <p>
          HearthGuide (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or the
          &ldquo;Site&rdquo;) is an independent Hearthstone strategy site
          reachable at{" "}
          <a className="text-[#4fc3f7] underline" href={SITE_URL}>
            {SITE_URL}
          </a>
          . We are not affiliated with or endorsed by Blizzard Entertainment.
        </p>
      </Section>

      <Section title="2. Data we collect">
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
          <li>
            <b>Request data.</b> When you visit a page, our hosting provider
            (Vercel) automatically receives your IP address, user agent and
            requested URL. This data is used to serve responses and detect
            abuse, and is normally retained for a short rolling window.
          </li>
          <li>
            <b>Analytics.</b> If enabled, we use privacy-friendly analytics
            (Vercel Analytics / Plausible / PostHog) to count visits and
            understand which pages perform. No cross-site tracking is performed
            by default.
          </li>
          <li>
            <b>Cookies & ads.</b> When third-party advertising is enabled, our
            partners (such as Google AdSense and its supply-chain) may set
            cookies to deliver and measure ads. See section 5.
          </li>
          <li>
            <b>Account data.</b> If you sign in (Google / Discord / GitHub) we
            store your email, display name and avatar from the OAuth provider.
            We never store your password.
          </li>
        </ul>
      </Section>

      <Section title="3. How we use the data">
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
          <li>To operate, secure, and improve the Site.</li>
          <li>To remember your language preference and favourites.</li>
          <li>To respond to messages you send us.</li>
          <li>To measure and improve ad relevance (when ads are enabled).</li>
        </ul>
      </Section>

      <Section title="4. Sharing">
        <p>
          We do not sell personal data. We rely on the following processors:
          Vercel (hosting), Supabase (database & auth), and — when enabled —
          Google AdSense / Stripe / Paddle / PostHog. Each is bound by its own
          privacy terms.
        </p>
      </Section>

      <Section title="5. Advertising (Google AdSense)">
        <p>
          When ads are enabled, Google and its partners use cookies to serve
          ads based on your prior visits to this and other websites. You can
          opt out of personalised ads at{" "}
          <a
            className="text-[#4fc3f7] underline"
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noreferrer noopener"
          >
            Google Ad Settings
          </a>{" "}
          or learn more at{" "}
          <a
            className="text-[#4fc3f7] underline"
            href="https://www.aboutads.info/"
            target="_blank"
            rel="noreferrer noopener"
          >
            aboutads.info
          </a>
          .
        </p>
      </Section>

      <Section title="6. Your rights (EU / UK / CA)">
        <p>
          Depending on where you live, you may have rights to access, correct,
          export or delete your personal data. Email{" "}
          <code className="text-[#f0b232]">privacy@hearthguide.app</code> and we
          will respond within 30 days.
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          The Site is not directed at children under 13 (or 16 in the EU). We
          do not knowingly collect data from them.
        </p>
      </Section>

      <Section title="8. Changes">
        <p>
          We may update this policy from time to time. Material changes will
          be reflected by the &ldquo;Last updated&rdquo; date at the top of
          this page.
        </p>
      </Section>
    </article>
  );
}

function ZhContent() {
  return (
    <article className="prose-like max-w-3xl mx-auto px-6 py-12 text-[#e8e6e3]">
      <h1 className="text-3xl font-bold gold-text mb-2">隐私政策</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新：2026 年 5 月 12 日</p>

      <Section title="1. 我们是谁">
        <p>
          HearthGuide（以下简称&ldquo;我们&rdquo;或&ldquo;本站&rdquo;）是一个独立的炉石传说攻略
          站点，访问地址为{" "}
          <a className="text-[#4fc3f7] underline" href={SITE_URL}>
            {SITE_URL}
          </a>
          。我们与暴雪娱乐（Blizzard Entertainment）没有任何隶属或代理关系。
        </p>
      </Section>

      <Section title="2. 我们收集的数据">
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
          <li>
            <b>请求数据：</b>访问页面时，我们的托管服务（Vercel）会自动接收你
            的 IP 地址、UA 与请求 URL，用于响应请求和反滥用，通常会在很短的
            滚动窗口内自动清理。
          </li>
          <li>
            <b>统计分析：</b>如启用，我们会使用注重隐私的统计工具（Vercel
            Analytics / Plausible / PostHog）了解访问情况，默认不进行跨站追踪。
          </li>
          <li>
            <b>Cookie 与广告：</b>当我们启用第三方广告（如 Google AdSense）
            时，其供应链合作方会下发 Cookie 以投放和度量广告，详见第 5 节。
          </li>
          <li>
            <b>账号数据：</b>如你使用 Google / Discord / GitHub 登录，我们会
            从 OAuth 服务商获取你的邮箱、昵称和头像，永远不会保存你的密码。
          </li>
        </ul>
      </Section>

      <Section title="3. 数据用途">
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
          <li>提供、保护和改进本站。</li>
          <li>记住你的语言偏好与收藏内容。</li>
          <li>回复你的反馈或咨询。</li>
          <li>在启用广告时度量并改进广告相关性。</li>
        </ul>
      </Section>

      <Section title="4. 数据共享">
        <p>
          我们不会出售你的个人数据。我们使用如下数据处理方：Vercel（托管）、
          Supabase（数据库与登录），以及在启用时的 Google AdSense / Stripe /
          Paddle / PostHog。它们各自受其自身隐私条款约束。
        </p>
      </Section>

      <Section title="5. 广告（Google AdSense）">
        <p>
          启用广告后，Google 及其合作方会使用 Cookie，根据你访问本站及其他
          网站的行为投放广告。你可以在{" "}
          <a
            className="text-[#4fc3f7] underline"
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noreferrer noopener"
          >
            Google 广告设置
          </a>{" "}
          关闭个性化广告，或访问{" "}
          <a
            className="text-[#4fc3f7] underline"
            href="https://www.aboutads.info/"
            target="_blank"
            rel="noreferrer noopener"
          >
            aboutads.info
          </a>{" "}
          了解更多。
        </p>
      </Section>

      <Section title="6. 你的权利">
        <p>
          根据你所在地区的法律（如 GDPR / CCPA），你可能享有访问、更正、
          导出或删除个人数据的权利。请发送邮件至{" "}
          <code className="text-[#f0b232]">privacy@hearthguide.app</code>，
          我们将在 30 天内回复。
        </p>
      </Section>

      <Section title="7. 儿童">
        <p>
          本站不面向 13 周岁（在欧盟为 16 周岁）以下的儿童，我们不会有意收集
          其个人数据。
        </p>
      </Section>

      <Section title="8. 更新">
        <p>本政策可能不定期更新，重大变更将通过页首的&ldquo;最后更新&rdquo;日期体现。</p>
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
