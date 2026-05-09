import { createClient } from "@supabase/supabase-js";
import { DEMO_DECKS } from "../src/lib/decks";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  console.error(
    "Tip: 在 Supabase Dashboard -> Settings -> API 获取 service_role key",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function seedDecks() {
  console.log("Clearing existing decks...");
  const { error: delErr } = await supabase
    .from("decks")
    .delete()
    .gte("id", 0);
  if (delErr) {
    console.error("Failed to clear decks:", delErr.message);
    process.exit(1);
  }

  const rows = DEMO_DECKS.map(({ id: _id, ...rest }) => rest);
  console.log(`Inserting ${rows.length} decks...`);
  const { error: insErr } = await supabase.from("decks").insert(rows);
  if (insErr) {
    console.error("Failed to insert decks:", insErr.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${rows.length} decks`);
}

seedDecks().catch((err) => {
  console.error(err);
  process.exit(1);
});
