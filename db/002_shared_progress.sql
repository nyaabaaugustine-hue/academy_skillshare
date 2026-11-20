-- Shared SkillBridge course progress for the website and Flutter clients.
-- Apply once as the Neon database owner after 001_leaderboard.sql.
-- Runtime code connects only with a restricted DML role; it never runs DDL.
-- Neon Auth remains the identity source. user_id is obtained server-side and
-- must never be accepted from a request body.

CREATE TABLE IF NOT EXISTS public.course_progress_events (
  user_id text NOT NULL,
  event_id text NOT NULL,
  step_id text NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS course_progress_events_user_time_idx
  ON public.course_progress_events (user_id, received_at DESC);

CREATE TABLE IF NOT EXISTS public.course_progress (
  user_id text NOT NULL,
  step_id text NOT NULL,
  best_score smallint NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  attempts integer NOT NULL CHECK (attempts > 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, step_id)
);

CREATE INDEX IF NOT EXISTS course_progress_user_updated_idx
  ON public.course_progress (user_id, updated_at DESC);

-- Replace this role name if the Neon website runtime uses a different least-
-- privilege role. Do not grant DDL or direct client access to Flutter.
GRANT SELECT, INSERT, UPDATE ON public.course_progress_events TO skillsbridge_website;
GRANT SELECT, INSERT, UPDATE ON public.course_progress TO skillsbridge_website;
