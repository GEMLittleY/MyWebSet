import { supabase } from "./supabase";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}
