import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SOURCE = "https://api.hearthstonejson.com/v1/latest/zhCN/cards.json";
const OUT = resolve(process.cwd(), "data/cards-zhCN.json");

type RawCard = {
  id: string;
  dbfId: number;
  name: string;
  cardClass?: string;
  cost?: number;
  type?: string;
  set?: string;
  rarity?: string;
  collectible?: boolean;
};

async function main() {
  console.log(`Fetching ${SOURCE} ...`);
  const res = await fetch(SOURCE);
  if (!res.ok) {
    console.error(`HTTP ${res.status}`);
    process.exit(1);
  }
  const all = (await res.json()) as RawCard[];
  console.log(`Got ${all.length} collectible cards`);

  const slim = all.map((c) => ({
    id: c.id,
    dbfId: c.dbfId,
    name: c.name,
    cardClass: c.cardClass,
    cost: c.cost,
    type: c.type,
    set: c.set,
    rarity: c.rarity,
  }));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(slim, null, 0));
  console.log(`Wrote ${OUT} (${(JSON.stringify(slim).length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
