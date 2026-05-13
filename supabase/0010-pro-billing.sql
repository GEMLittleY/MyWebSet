-- Pro subscription state lives directly on profiles to keep the hot path
-- (is the current user Pro?) a single PK lookup. Provider-specific ids let
-- us reconcile webhooks back to the right user without scanning.
--
-- `pro_until` is the soft expiry: a user keeps Pro access until this
-- timestamp even after cancel. `is_pro` is the materialised flag we read
-- everywhere — webhooks keep both in sync.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_pro                 BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pro_until              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_provider       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_status         TEXT;
-- billing_status values: active | trialing | past_due | canceled | expired | none

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_paddle_subscription_idx
  ON profiles (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

-- Append-only audit trail of every webhook we process. Useful for support
-- ("why did my Pro lapse?") and for replaying events when reconciling.
CREATE TABLE IF NOT EXISTS billing_events (
  id           BIGSERIAL PRIMARY KEY,
  provider     TEXT NOT NULL,            -- 'stripe' | 'paddle'
  event_id     TEXT NOT NULL,            -- provider event id (dedupe key)
  event_type   TEXT NOT NULL,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payload      JSONB NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS billing_events_user_idx
  ON billing_events (user_id, received_at DESC);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
-- No public policies; only the service role (used by webhook handlers)
-- reads/writes this table.
