import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (supabase) await supabase.from("posts").select("id").limit(1);
  } catch {
    // ignore - this is just to keep the database active
  }
  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
