import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "我的收藏" : "Favourites",
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/favorites` },
  };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isZh = lang === "zh";
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold gold-text mb-2">
        {isZh ? "我的收藏" : "Favourites"}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {isZh
          ? "收藏功能正在内测中，下一个版本就到。"
          : "Favourites are arriving in the next release."}
      </p>
      <Link
        href={`/${lang}/account`}
        className="text-sm text-[#4fc3f7] hover:underline"
      >
        {isZh ? "← 返回账户" : "← Back to account"}
      </Link>
    </div>
  );
}
