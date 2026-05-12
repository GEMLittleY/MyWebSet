-- Threaded comments for decks and guides. One-level threading: top-level
-- comments have parent_id NULL, replies set parent_id to the top-level row.
-- We FK user_id to profiles.id (which 1:1 maps to auth.users.id) so we can
-- embed author name + avatar via PostgREST in a single round-trip.

CREATE TABLE IF NOT EXISTS comments (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('deck', 'guide')),
  target_id   TEXT NOT NULL,
  parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT body_not_empty CHECK (deleted OR length(trim(body)) > 0),
  CONSTRAINT body_max_len   CHECK (length(body) <= 4000)
);

CREATE INDEX IF NOT EXISTS comments_target_idx
  ON comments (target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS comments_parent_idx
  ON comments (parent_id) WHERE parent_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_comments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_touch_updated_at ON comments;
CREATE TRIGGER comments_touch_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_comments_updated_at();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_all ON comments;
CREATE POLICY comments_select_all ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_insert_own ON comments;
CREATE POLICY comments_insert_own ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND length(trim(body)) > 0
    AND length(body) <= 4000
  );

-- Owner can edit body / soft-delete; nothing else may UPDATE.
DROP POLICY IF EXISTS comments_update_own ON comments;
CREATE POLICY comments_update_own ON comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hard delete remains owner-only too (rarely used; UI uses soft-delete).
DROP POLICY IF EXISTS comments_delete_own ON comments;
CREATE POLICY comments_delete_own ON comments
  FOR DELETE USING (auth.uid() = user_id);
