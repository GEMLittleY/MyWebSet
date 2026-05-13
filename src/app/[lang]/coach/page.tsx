import type { Metadata } from "next";
import { Suspense } from "react";
import CoachChat from "@/components/CoachChat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "AI 教练" : "AI Coach",
    description:
      lang === "zh"
        ? "炉石 AI 教练：根据你的卡组与对阵给出实时建议。"
        : "Hearthstone AI coach: live strategy advice tuned to your deck and matchup.",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${lang}/coach`,
      languages: {
        en: "/en/coach",
        "zh-CN": "/zh/coach",
        "x-default": "/en/coach",
      },
    },
  };
}

export default async function CoachPage({
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ deck?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">…</p>
        </div>
      }
    >
      <CoachChat
        key={`coach:${sp.deck ?? "global"}`}
        initialDeckSlug={sp.deck ?? null}
      />
    </Suspense>
  );
}
