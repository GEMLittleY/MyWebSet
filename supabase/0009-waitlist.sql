-- Pro waitlist. Used for early-access marketing emails. Rows are written
-- via the API route using the service-role key (which bypasses RLS),
-- so user-facing policies stay locked down.

CREATE TABLE IF NOT EXISTS pro_waitlist (
  email        TEXT PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source       TEXT,
  lang         TEXT
);

CREATE INDEX IF NOT EXISTS pro_waitlist_signed_up_idx
  ON pro_waitlist (signed_up_at DESC);

ALTER TABLE pro_waitlist ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service role may read/write. Authenticated
-- users hit the table indirectly through /api/waitlist.
