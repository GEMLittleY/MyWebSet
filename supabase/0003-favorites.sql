-- Per-user favourites for decks, cards, and guides.
-- target_id is opaque text (deck slug, card dbf id as string, guide slug).

CREATE TABLE IF NOT EXISTS favorites (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('deck', 'card', 'guide')),
  target_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS favorites_target_idx
  ON favorites (target_type, target_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorites_select_own ON favorites;
CREATE POLICY favorites_select_own ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS favorites_insert_own ON favorites;
CREATE POLICY favorites_insert_own ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS favorites_delete_own ON favorites;
CREATE POLICY favorites_delete_own ON favorites
  FOR DELETE USING (auth.uid() = user_id);
