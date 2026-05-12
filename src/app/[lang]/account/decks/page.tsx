import type { Metadata } from "next";
import MyDecksContent from "@/components/MyDecksContent";

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
  return <MyDecksContent lang={lang === "zh" ? "zh" : "en"} />;
}
