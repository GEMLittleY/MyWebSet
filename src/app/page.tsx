import { getAllDecks } from "@/lib/decks";
import { getAllPosts } from "@/lib/posts";
import HomeContent from "@/components/HomeContent";

export const revalidate = 60;

export default async function Home() {
  const decks = await getAllDecks();
  const posts = await getAllPosts();
  const topDecks = decks.filter((d) => d.tier <= 2).slice(0, 6);
  const recentPosts = posts.slice(0, 3);

  return <HomeContent topDecks={topDecks} recentPosts={recentPosts} />;
}
