-- Public profile mirror of auth.users so we can show display name + avatar
-- everywhere without leaking the JWT-only auth.users table.
--
-- Run inside the Supabase SQL editor (idempotent).

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  provider     TEXT,           -- "google" | "discord" | "github" | "email"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON profiles (display_name);

-- Touch updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_profiles_updated_at();

-- Auto-create a profile row when a user first signs up. Pulls best-effort
-- name + avatar out of OAuth metadata; falls back to the email local part.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_app  JSONB := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  v_name TEXT;
  v_avatar TEXT;
  v_provider TEXT;
BEGIN
  v_provider := COALESCE(v_app->>'provider', 'email');

  v_name := COALESCE(
    v_meta->>'name',
    v_meta->>'full_name',
    v_meta->>'user_name',     -- github
    v_meta->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );

  v_avatar := COALESCE(
    v_meta->>'avatar_url',
    v_meta->>'picture'
  );

  INSERT INTO public.profiles (id, email, display_name, avatar_url, provider)
    VALUES (NEW.id, NEW.email, v_name, v_avatar, v_provider)
    ON CONFLICT (id) DO UPDATE
      SET email        = EXCLUDED.email,
          display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
          avatar_url   = COALESCE(profiles.avatar_url,   EXCLUDED.avatar_url),
          provider     = COALESCE(profiles.provider,     EXCLUDED.provider);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill rows for users created before the trigger existed.
INSERT INTO public.profiles (id, email, display_name, avatar_url, provider)
SELECT u.id,
       u.email,
       COALESCE(
         u.raw_user_meta_data->>'name',
         u.raw_user_meta_data->>'full_name',
         u.raw_user_meta_data->>'user_name',
         split_part(u.email, '@', 1)
       ),
       COALESCE(
         u.raw_user_meta_data->>'avatar_url',
         u.raw_user_meta_data->>'picture'
       ),
       COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Row-level security: anyone can read public profile fields, only the owner
-- can update their own row, and inserts/deletes happen through the trigger
-- + cascade — we don't expose them to the API.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
