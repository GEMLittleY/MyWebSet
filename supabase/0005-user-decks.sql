-- User-authored decks (drafts and public variants).
-- Distinct from `decks` (curated meta decks): different schema, owned by a
-- specific user, can be private or published.

CREATE TABLE IF NOT EXISTS user_decks (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  hero_class   TEXT NOT NULL,
  archetype    TEXT,
  deck_code    TEXT,
  card_list    JSONB NOT NULL DEFAULT '[]'::jsonb,
  dust_cost    INTEGER NOT NULL DEFAULT 0,
  parent_slug  TEXT,                -- forked from this curated deck slug
  is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_deck_title_len CHECK (length(title) BETWEEN 1 AND 80)
);

CREATE INDEX IF NOT EXISTS user_decks_user_idx
  ON user_decks (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS user_decks_public_idx
  ON user_decks (is_public, updated_at DESC) WHERE is_public = TRUE;

CREATE OR REPLACE FUNCTION public.touch_user_decks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_decks_touch_updated_at ON user_decks;
CREATE TRIGGER user_decks_touch_updated_at
  BEFORE UPDATE ON user_decks
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_decks_updated_at();

ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Public can read published decks; the owner can always read their own.
DROP POLICY IF EXISTS user_decks_select ON user_decks;
CREATE POLICY user_decks_select ON user_decks
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS user_decks_insert_own ON user_decks;
CREATE POLICY user_decks_insert_own ON user_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_decks_update_own ON user_decks;
CREATE POLICY user_decks_update_own ON user_decks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_decks_delete_own ON user_decks;
CREATE POLICY user_decks_delete_own ON user_decks
  FOR DELETE USING (auth.uid() = user_id);
