import Link from "next/link";
import { getAllDecks } from "@/lib/decks";
import { getAllPosts } from "@/lib/posts";
import DeckCard from "@/components/DeckCard";

export const revalidate = 60;

export default async function Home() {
  const decks = await getAllDecks();
  const posts = await getAllPosts();
  const topDecks = decks.filter((d) => d.tier <= 2).slice(0, 6);
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-bold">
          <span className="gold-text">HearthGuide</span>
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          你的炉石上分伴侣
        </p>
        <p className="mt-2 text-gray-500 max-w-xl mx-auto">
          最新卡组推荐、Meta 分析和上分攻略，助你从青铜到传说。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/decks"
            className="px-6 py-3 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold hover:bg-[#d4982a] transition-colors"
          >
            浏览卡组
          </Link>
          <Link
            href="/meta"
            className="px-6 py-3 rounded-lg border border-[#2a3040] text-gray-300 hover:border-[#f0b232] hover:text-[#f0b232] transition-colors"
          >
            Meta 报告
          </Link>
        </div>
      </section>

      {/* Top Decks */}
      <section className="py-12 border-t border-[#2a3040]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold gold-text">强势卡组</h2>
          <Link href="/decks" className="text-sm text-[#4fc3f7] hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>

      {/* Recent Guides */}
      <section className="py-12 border-t border-[#2a3040]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold gold-text">最新攻略</h2>
          <Link href="/guides" className="text-sm text-[#4fc3f7] hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/guides/${post.slug}`}
              className="card block p-5 hover:border-[#4fc3f7]"
            >
              <h3 className="font-semibold text-[#e8e6e3]">{post.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-12 border-t border-[#2a3040]">
        <div className="card p-8 text-center border-[#f0b232]/30">
          <h2 className="text-2xl font-bold gold-text mb-3">不知道玩什么？</h2>
          <p className="text-gray-400 mb-6">
            告诉 AI 你的段位和拥有的卡牌，获取最适合你的卡组推荐
          </p>
          <Link
            href="/recommend"
            className="inline-block px-6 py-3 rounded-lg bg-[#4fc3f7] text-[#0f1419] font-semibold hover:bg-[#3aa8d8] transition-colors"
          >
            AI 卡组推荐
          </Link>
        </div>
      </section>
    </div>
  );
}
