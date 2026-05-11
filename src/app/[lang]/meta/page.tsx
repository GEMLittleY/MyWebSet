import { getAllDecks } from "@/lib/decks";
import MetaContent from "@/components/MetaContent";
import type { Metadata } from "next";
import { getDict, type Lang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict((lang === "zh" ? "zh" : "en") as Lang);
  return {
    title: t.meta.title,
    description: t.meta.desc,
    alternates: {
      canonical: `/${lang}/meta`,
      languages: {
        en: "/en/meta",
        "zh-CN": "/zh/meta",
        "x-default": "/en/meta",
      },
    },
  };
}

export default async function MetaPage() {
  const decks = await getAllDecks();
  return <MetaContent decks={decks} />;
}
