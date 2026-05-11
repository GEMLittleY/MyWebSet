// Fetch current meta deck listings from hsguru.com.
// Hsguru is unreachable from mainland China without a proxy. Set HTTPS_PROXY
// (or HTTP_PROXY) in the environment to point at your local proxy, e.g.:
//
//   HTTPS_PROXY=http://127.0.0.1:7890 npm run meta:fetch
//
// Output: data/hsguru-snapshot/<name>.md

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  console.log(`Using proxy: ${proxy}`);
  setGlobalDispatcher(new ProxyAgent(proxy));
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type Source = {
  name: string;
  url: string;
};

const SOURCES: Source[] = [
  {
    name: "standard-top-legend-800",
    url: "https://www.hsguru.com/decks?format=2&period=past_week&rank=top_legend&min_games=800&order_by=winrate",
  },
  {
    name: "standard-legend-400",
    url: "https://www.hsguru.com/decks?format=2&period=past_week&rank=legend&min_games=400&order_by=winrate",
  },
  {
    name: "wild-legend-400",
    url: "https://www.hsguru.com/decks?format=1&period=past_week&rank=legend&min_games=400&order_by=winrate",
  },
  {
    name: "wild-diamond-to-legend-800",
    url: "https://www.hsguru.com/decks?format=1&period=past_week&rank=diamond_to_legend&min_games=800&order_by=winrate",
  },
];

async function fetchOne(src: Source) {
  console.log(`Fetching ${src.name} ...`);
  const res = await fetch(src.url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${src.url} HTTP ${res.status}`);
  const html = await res.text();
  const out = resolve(process.cwd(), `data/hsguru-snapshot/${src.name}.html`);
  writeFileSync(out, html);
  const decks = (html.match(/<h3[^>]*>\s*<a[^>]+href="\/deck\/\d+"/g) || []).length;
  console.log(`  wrote ${out} (${(html.length / 1024).toFixed(0)} KB, ~${decks} decks)`);
}

async function main() {
  mkdirSync(resolve(process.cwd(), "data/hsguru-snapshot"), { recursive: true });
  for (const src of SOURCES) {
    try {
      await fetchOne(src);
    } catch (e) {
      console.error(`  FAILED: ${(e as Error).message}`);
    }
  }
}

main();
