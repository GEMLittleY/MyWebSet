-- In-app notifications. Right now we only emit one kind automatically
-- (someone replied to your comment); the schema is generic so we can add
-- more later (deck update, follower joined, system announcement).

CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,            -- e.g. 'comment_reply', 'system'
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  link        TEXT,                     -- optional in-app deep link
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Recipient may read and mark their own rows. Inserts/deletes happen via
-- SECURITY DEFINER triggers (or the service role); we don't expose them
-- to the API.
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_delete_own ON notifications;
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Helper: when a reply comment is inserted, notify the parent's author
-- (unless they replied to themselves).
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_parent_user UUID;
  v_parent_target_type TEXT;
  v_parent_target_id   TEXT;
  v_replier_name TEXT;
  v_link TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, target_type, target_id
    INTO v_parent_user, v_parent_target_type, v_parent_target_id
    FROM comments
   WHERE id = NEW.parent_id;

  IF v_parent_user IS NULL OR v_parent_user = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, email)
    INTO v_replier_name
    FROM profiles
   WHERE id = NEW.user_id;

  v_link := CASE v_parent_target_type
              WHEN 'deck'  THEN '/decks/'  || v_parent_target_id
              WHEN 'guide' THEN '/guides/' || v_parent_target_id
              ELSE NULL
            END;

  INSERT INTO notifications (user_id, type, payload, link)
    VALUES (
      v_parent_user,
      'comment_reply',
      jsonb_build_object(
        'replier_id',   NEW.user_id,
        'replier_name', v_replier_name,
        'comment_id',   NEW.id,
        'parent_id',    NEW.parent_id,
        'target_type',  v_parent_target_type,
        'target_id',    v_parent_target_id,
        'preview',      LEFT(NEW.body, 140)
      ),
      v_link
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_notify_reply ON comments;
CREATE TRIGGER comments_notify_reply
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_reply();
