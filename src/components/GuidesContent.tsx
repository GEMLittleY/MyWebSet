"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import type { Post } from "@/lib/supabase";

export default function GuidesContent({ posts }: { posts: Post[] }) {
  const { t, lang, localePath } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold gold-text mb-2">{t.guides.title}</h1>
      <p className="text-gray-500 mb-8">
        {posts.length} {lang === "en" ? "guides" : "篇攻略"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => {
          const date = new Date(post.published_at).toLocaleDateString(
            lang === "en" ? "en-US" : "zh-CN",
            { year: "numeric", month: "long", day: "numeric" },
          );
          return (
            <Link
              key={post.id}
              href={localePath(`/guides/${post.slug}`)}
              className="card block overflow-hidden hover:border-[#4fc3f7]"
            >
              {post.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-5">
                <time className="text-xs text-gray-500">{date}</time>
                <h2 className="text-lg font-semibold text-[#e8e6e3] mt-1">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>
                <span className="inline-block mt-3 text-xs text-[#4fc3f7]">
                  {t.guides.readMore}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
