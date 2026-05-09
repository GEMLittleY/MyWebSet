import { getDeckBySlug, getAllDecks } from "@/lib/decks";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DeckDetailContent from "@/components/DeckDetailContent";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);
  if (!deck) return { title: "卡组未找到" };
  return {
    title: `${deck.title} - HearthGuide`,
    description: `${deck.title_en} - 胜率 ${deck.win_rate}%`,
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const decks = await getAllDecks();
  return decks.map((d) => ({ slug: d.slug }));
}

export default async function DeckDetailPage({ params }: Props) {
  const { slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck) notFound();

  return <DeckDetailContent deck={deck} />;
}
