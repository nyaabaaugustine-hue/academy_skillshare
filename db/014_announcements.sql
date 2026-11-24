-- Admin announcements and FCM device tokens for the Flutter app.
-- Apply once as the Neon database owner after 013_fcm_campaigns.sql.
-- Runtime code connects only with a restricted DML role; it never runs DDL.
-- Neon Auth remains the identity source. user_id is obtained server-side and
-- must never be accepted from a request body.

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  user_id text NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

CREATE INDEX IF NOT EXISTS fcm_tokens_platform_idx
  ON public.fcm_tokens (platform);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_created_at_idx
  ON public.announcements (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.announcements (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS announcement_reads_user_idx
  ON public.announcement_reads (user_id, read_at DESC);

-- Replace this role name if the Neon website runtime uses a different least-
-- privilege role. Do not grant DDL or direct client access to Flutter.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fcm_tokens TO skillsbridge_website;
GRANT SELECT, INSERT ON public.announcements TO skillsbridge_website;
GRANT SELECT, INSERT, UPDATE ON public.announcement_reads TO skillsbridge_website;
