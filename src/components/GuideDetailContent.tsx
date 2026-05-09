"use client";

import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLanguage } from "./LanguageProvider";
import type { Post } from "@/lib/supabase";

export default function GuideDetailContent({ post }: { post: Post }) {
  const { t, lang } = useLanguage();

  const date = new Date(post.published_at).toLocaleDateString(
    lang === "en" ? "en-US" : "zh-CN",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/guides"
        className="text-sm text-gray-500 hover:text-[#f0b232] transition-colors"
      >
        {t.guides.back}
      </Link>

      <article className="mt-6">
        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-56 object-cover rounded-xl mb-6"
            loading="lazy"
          />
        )}
        <header className="mb-8">
          <time className="text-sm text-gray-500">{date}</time>
          <h1 className="mt-2 text-3xl font-bold text-[#e8e6e3]">
            {post.title}
          </h1>
        </header>
        <MarkdownRenderer content={post.content} />
      </article>
    </div>
  );
}
