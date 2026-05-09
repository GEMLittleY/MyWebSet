import { getAllDecks } from "@/lib/decks";
import MetaContent from "@/components/MetaContent";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Meta 报告 - HearthGuide",
  description: "炉石传说当前版本 Meta 分析与 Tier 排名",
};

export default async function MetaPage() {
  const decks = await getAllDecks();
  return <MetaContent decks={decks} />;
}
