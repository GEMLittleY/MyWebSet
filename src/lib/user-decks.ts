import type { SupabaseClient } from "@supabase/supabase-js";

export type UserDeckCard = {
  card_id: string | number;
  count: number;
};

export type UserDeck = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  hero_class: string;
  archetype: string | null;
  deck_code: string | null;
  card_list: UserDeckCard[];
  dust_cost: number;
  parent_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type UserDeckInput = Omit<
  UserDeck,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export async function listMyDecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDeck[]> {
  const { data, error } = await supabase
    .from("user_decks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserDeck[];
}

export async function getMyDeckById(
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<UserDeck | null> {
  const { data, error } = await supabase
    .from("user_decks")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as UserDeck | null) ?? null;
}

export async function createDeck(
  supabase: SupabaseClient,
  userId: string,
  input: UserDeckInput,
): Promise<UserDeck> {
  const { data, error } = await supabase
    .from("user_decks")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserDeck;
}

export async function updateDeck(
  supabase: SupabaseClient,
  id: number,
  patch: Partial<UserDeckInput>,
): Promise<UserDeck> {
  const { data, error } = await supabase
    .from("user_decks")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserDeck;
}

export async function deleteDeck(
  supabase: SupabaseClient,
  id: number,
): Promise<void> {
  const { error } = await supabase.from("user_decks").delete().eq("id", id);
  if (error) throw error;
}
