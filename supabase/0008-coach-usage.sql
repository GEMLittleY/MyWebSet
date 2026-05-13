-- Per-call log for the AI coach so we can rate-limit free users to N
-- messages/day. Once subscription billing lands we'll check is_pro on
-- the profile and bypass this counter.

CREATE TABLE IF NOT EXISTS coach_usage (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coach_usage_user_day_idx
  ON coach_usage (user_id, created_at DESC);

ALTER TABLE coach_usage ENABLE ROW LEVEL SECURITY;

-- Owner may inspect their own usage but nobody can write directly — the
-- API route uses the user's session and inserts on their behalf.
DROP POLICY IF EXISTS coach_usage_select_own ON coach_usage;
CREATE POLICY coach_usage_select_own ON coach_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS coach_usage_insert_own ON coach_usage;
CREATE POLICY coach_usage_insert_own ON coach_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
