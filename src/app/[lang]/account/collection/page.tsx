import type { Metadata } from "next";
import CollectionEditor from "@/components/CollectionEditor";
import { getCardIndex } from "@/lib/cards";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "我的收藏" : "My collection",
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/collection` },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cards = getCardIndex();
  return (
    <CollectionEditor cards={cards} lang={lang === "zh" ? "zh" : "en"} />
  );
}
