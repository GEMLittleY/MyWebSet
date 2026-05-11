"use client";

import Link from "next/link";
import { useIsPro } from "@/lib/useIsPro";
import { useLanguage } from "./LanguageProvider";
import ProBadge from "./ProBadge";

/**
 * Wraps a Pro-only feature. Free users see a frosted-glass paywall card with
 * an upgrade CTA; Pro users see the children unchanged.
 *
 * Usage:
 *   <RequirePro feature="ai-coach">
 *     <AiCoachUI />
 *   </RequirePro>
 */
export default function RequirePro({
  feature,
  children,
  title,
  description,
}: {
  feature?: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { isPro, loading } = useIsPro();
  const { lang, localePath } = useLanguage();

  if (loading) {
    return <div className="card p-6 text-center text-gray-500">…</div>;
  }
  if (isPro) return <>{children}</>;

  const resolvedTitle =
    title ??
    (lang === "zh" ? "升级 Pro 解锁此功能" : "Upgrade to Pro to unlock");
  const resolvedDesc =
    description ??
    (lang === "zh"
      ? "Pro 会员可去除广告，无限使用 AI 教练、集合分析等高级工具。"
      : "Pro members get an ad-free experience, unlimited AI coaching, and advanced collection tools.");

  return (
    <div className="card p-8 text-center border-[#f0b232]/40 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419]">
      <ProBadge size="md" className="mb-4" />
      <h3 className="text-xl font-bold text-[#e8e6e3] mb-2">{resolvedTitle}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
        {resolvedDesc}
      </p>
      <Link
        href={localePath("/pricing")}
        className="inline-block px-6 py-3 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold hover:bg-[#d4982a] transition-colors"
        data-feature={feature}
      >
        {lang === "zh" ? "查看 Pro 方案" : "See Pro plans"}
      </Link>
    </div>
  );
}
