import type { Metadata } from "next";
import PricingContent from "@/components/PricingContent";
import { billingConfig } from "@/lib/pro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "Pricing · Pro 方案" : "Pricing · Go Pro",
    description:
      lang === "zh"
        ? "免费 vs Pro 对比：去广告、无限 AI 教练、集合差额、自定义卡组库。"
        : "Free vs Pro comparison: ad-free experience, unlimited AI coaching, collection tools, custom decks.",
    alternates: {
      canonical: `/${lang}/pricing`,
      languages: {
        en: "/en/pricing",
        "zh-CN": "/zh/pricing",
        "x-default": "/en/pricing",
      },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cfg = billingConfig();
  const billingEnabled =
    cfg.enabled &&
    Boolean(cfg.stripe.priceMonthly) &&
    Boolean(cfg.stripe.priceAnnual);
  return (
    <PricingContent
      lang={lang === "zh" ? "zh" : "en"}
      billingEnabled={billingEnabled}
    />
  );
}
