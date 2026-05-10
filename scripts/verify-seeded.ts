import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const cards = JSON.parse(
  readFileSync(resolve(process.cwd(), "data/cards-zhCN.json"), "utf8"),
) as Array<{ id: string; name: string; dbfId: number }>;
const validIds = new Set(cards.map((c) => c.id));

async function main() {
  const { data, error } = await sb.from("decks").select("*").order("id");
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log("Decks in Supabase:", data!.length);

  let totalCards = 0;
  let bad = 0;
  for (const d of data!) {
    for (const c of d.card_list as Array<{ name: string; card_id: string; cost: number; count: number }>) {
      totalCards++;
      if (!c.card_id || !validIds.has(c.card_id)) {
        bad++;
        if (bad < 10) {
          console.log(`  BAD: "${d.title}" / ${c.name} card_id=${c.card_id}`);
        }
      }
    }
  }
  console.log(`Total card entries: ${totalCards}, bad: ${bad} (${((bad / totalCards) * 100).toFixed(1)}%)`);
  console.log("Sample deck:", {
    title: data![0]!.title,
    hero_class: data![0]!.hero_class,
    archetype: data![0]!.archetype,
    win_rate: data![0]!.win_rate,
    dust_cost: data![0]!.dust_cost,
    card_count: data![0]!.card_list.length,
  });
}

main();
