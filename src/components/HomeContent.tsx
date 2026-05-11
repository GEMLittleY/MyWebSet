"use client";

import Link from "next/link";
import DeckCard from "./DeckCard";
import { useLanguage } from "./LanguageProvider";
import type { Deck } from "@/lib/decks";
import type { Post } from "@/lib/supabase";

export default function HomeContent({
  topDecks,
  recentPosts,
}: {
  topDecks: Deck[];
  recentPosts: Post[];
}) {
  const { t, lang, localePath } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-bold">
          <span className="gold-text">{t.hero.title}</span>
        </h1>
        <p className="mt-4 text-xl text-gray-400">{t.hero.subtitle}</p>
        <p className="mt-2 text-gray-500 max-w-xl mx-auto">{t.hero.desc}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href={localePath("/decks")}
            className="px-6 py-3 rounded-lg bg-[#f0b232] text-[#0f1419] font-semibold hover:bg-[#d4982a] transition-colors"
          >
            {t.hero.cta}
          </Link>
          <Link
            href={localePath("/meta")}
            className="px-6 py-3 rounded-lg border border-[#2a3040] text-gray-300 hover:border-[#f0b232] hover:text-[#f0b232] transition-colors"
          >
            {t.hero.ctaMeta}
          </Link>
        </div>
      </section>

      <section className="py-12 border-t border-[#2a3040]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold gold-text">
            {lang === "en" ? "Top Decks" : "强势卡组"}
          </h2>
          <Link
            href={localePath("/decks")}
            className="text-sm text-[#4fc3f7] hover:underline"
          >
            {lang === "en" ? "View all →" : "查看全部 →"}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>

      <section className="py-12 border-t border-[#2a3040]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold gold-text">
            {lang === "en" ? "Latest Guides" : "最新攻略"}
          </h2>
          <Link
            href={localePath("/guides")}
            className="text-sm text-[#4fc3f7] hover:underline"
          >
            {lang === "en" ? "View all →" : "查看全部 →"}
          </Link>
        </div>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={localePath(`/guides/${post.slug}`)}
              className="card flex gap-4 p-5 hover:border-[#4fc3f7] overflow-hidden"
            >
              {post.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                  loading="lazy"
                />
              )}
              <div>
                <h3 className="font-semibold text-[#e8e6e3]">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12 border-t border-[#2a3040]">
        <div className="card p-8 text-center border-[#f0b232]/30">
          <h2 className="text-2xl font-bold gold-text mb-3">
            {lang === "en" ? "Not sure what to play?" : "不知道玩什么？"}
          </h2>
          <p className="text-gray-400 mb-6">{t.recommend.desc}</p>
          <Link
            href={localePath("/recommend")}
            className="inline-block px-6 py-3 rounded-lg bg-[#4fc3f7] text-[#0f1419] font-semibold hover:bg-[#3aa8d8] transition-colors"
          >
            {t.recommend.title}
          </Link>
        </div>
      </section>
    </div>
  );
}
