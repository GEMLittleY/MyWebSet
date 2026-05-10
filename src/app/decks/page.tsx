import { getAllDecks } from "@/lib/decks";
import DecksContent from "@/components/DecksContent";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "卡组库 - HearthGuide",
  description: "炉石传说最新强势卡组合集，按模式、职业和类型筛选",
};

export default async function DecksPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; type?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const allDecks = await getAllDecks();
  const classFilter = params.class || "all";
  const typeFilter = params.type || "all";
  const modeFilter = params.mode === "wild" ? "wild" : "standard";

  return (
    <DecksContent
      allDecks={allDecks}
      initialClassFilter={classFilter}
      initialTypeFilter={typeFilter}
      initialModeFilter={modeFilter}
    />
  );
}
