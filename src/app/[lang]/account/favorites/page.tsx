import type { Metadata } from "next";
import FavoritesContent from "@/components/FavoritesContent";

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
  return <FavoritesContent lang={lang === "zh" ? "zh" : "en"} />;
}
