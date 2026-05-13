-- Card collection ownership per user. Keyed by the canonical Hearthstone
-- dbfId so it survives card-text translations and renaming.
--
-- `count` is the total number of copies the user owns (regular + golden).
-- For the dust diff we only care about total, but we keep `golden` separate
-- so we can later show value of golden cards owned.

CREATE TABLE IF NOT EXISTS user_collection (
  user_id      UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_dbf_id  INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0
               CHECK (count >= 0 AND count <= 99),
  golden       INTEGER NOT NULL DEFAULT 0
               CHECK (golden >= 0 AND golden <= 99),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_dbf_id)
);

CREATE INDEX IF NOT EXISTS user_collection_user_idx
  ON user_collection (user_id);

CREATE OR REPLACE FUNCTION public.touch_user_collection_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_collection_touch_updated_at ON user_collection;
CREATE TRIGGER user_collection_touch_updated_at
  BEFORE UPDATE ON user_collection
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_collection_updated_at();

ALTER TABLE user_collection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_collection_select_own ON user_collection;
CREATE POLICY user_collection_select_own ON user_collection
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_collection_insert_own ON user_collection;
CREATE POLICY user_collection_insert_own ON user_collection
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_collection_update_own ON user_collection;
CREATE POLICY user_collection_update_own ON user_collection
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_collection_delete_own ON user_collection;
CREATE POLICY user_collection_delete_own ON user_collection
  FOR DELETE USING (auth.uid() = user_id);
