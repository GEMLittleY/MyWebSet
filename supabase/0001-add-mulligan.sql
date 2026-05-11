-- Adds mulligan stats to decks. Shape:
--   { "card_id": "EX1_xxx", "keep_rate": 0.78, "win_rate_kept": 0.56,
--     "win_rate_not_kept": 0.48 } [ ... ]
--
-- Run inside the Supabase SQL editor. Safe to re-run.

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS mulligan JSONB DEFAULT '[]'::jsonb;

-- Optional: index for any later JSON path lookups (no-op if unused).
CREATE INDEX IF NOT EXISTS decks_mulligan_idx ON decks USING GIN (mulligan);
