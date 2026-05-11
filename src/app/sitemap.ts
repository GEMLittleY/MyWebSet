import type { MetadataRoute } from "next";
import { getAllDecks } from "@/lib/decks";
import { getAllPosts } from "@/lib/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

const LANGS = ["en", "zh"] as const;

const STATIC_PATHS = [
  "",
  "/decks",
  "/cards",
  "/guides",
  "/meta",
  "/recommend",
  "/pricing",
  "/legal/privacy",
  "/legal/terms",
] as const;

function bilingual(path: string, lastModified?: Date | string) {
  return LANGS.map((lang) => ({
    url: `${SITE_URL}/${lang}${path}`,
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        LANGS.map((l) => [
          l === "zh" ? "zh-CN" : "en",
          `${SITE_URL}/${l}${path}`,
        ]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [decks, posts] = await Promise.all([getAllDecks(), getAllPosts()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((p) =>
    bilingual(p, new Date()),
  );

  const deckEntries: MetadataRoute.Sitemap = decks.flatMap((d) =>
    bilingual(`/decks/${d.slug}`, d.published_at ?? d.created_at),
  );

  const guideEntries: MetadataRoute.Sitemap = posts.flatMap((p) =>
    bilingual(`/guides/${p.slug}`, p.published_at ?? p.created_at),
  );

  return [...staticEntries, ...deckEntries, ...guideEntries];
}
