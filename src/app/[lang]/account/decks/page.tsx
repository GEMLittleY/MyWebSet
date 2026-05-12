import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "我的卡组" : "My decks",
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/decks` },
  };
}

export default async function MyDecksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isZh = lang === "zh";
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold gold-text mb-2">
        {isZh ? "我的卡组" : "My decks"}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {isZh
          ? "你保存的草稿和上传的卡组将出现在这里。"
          : "Drafts and published decks will live here."}
      </p>
      <Link
        href={`/${lang}/builder`}
        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] mr-3"
      >
        {isZh ? "前往构筑器" : "Open builder"}
      </Link>
      <Link
        href={`/${lang}/account`}
        className="text-sm text-[#4fc3f7] hover:underline"
      >
        {isZh ? "← 返回账户" : "← Back to account"}
      </Link>
    </div>
  );
}
