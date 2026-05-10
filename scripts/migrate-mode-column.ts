// One-time: ensure decks table has a `game_mode` column.
// We attempt the ALTER via Supabase's `pg_meta` shouldn't be assumed; instead
// we just verify the column exists and instruct the user if it doesn't.

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  const { data, error } = await sb.from("decks").select("id, game_mode").limit(1);
  if (error) {
    console.error("\n❌ decks.game_mode column missing or query failed.");
    console.error("Run this SQL in Supabase Dashboard → SQL Editor:");
    console.error(
      "\n  ALTER TABLE decks ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'standard';\n",
    );
    console.error("Original error:", error.message);
    process.exit(1);
  }
  console.log("✓ decks.game_mode column exists. Sample row:", data?.[0] ?? "(empty)");
}

main();
