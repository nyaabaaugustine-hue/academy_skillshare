-- SkillBridge Academy — shared leaderboard
--
-- Run once in the Neon SQL editor (or `psql "$DATABASE_URL" -f db/001_leaderboard.sql`
-- as the database owner). The website role cannot create tables in `public`, so
-- this file exists instead of relying on runtime DDL.
--
-- After this runs, the app and the site both read and write the same ranking.
-- The API checks that the table is accessible but never creates database objects.

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id text PRIMARY KEY,                     -- 'web:<auth user id>' or 'app:<learner ref>'
  display_name text NOT NULL,
  avatar_data text,                        -- small data URL, <= 60 KB
  steps_completed integer NOT NULL DEFAULT 0,
  practices_completed integer NOT NULL DEFAULT 0,
  score_total integer NOT NULL DEFAULT 0,  -- sum of per-step scores (0-100 each)
  source text NOT NULL DEFAULT 'web',      -- 'web' | 'app'
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leaderboard_ranking_idx
  ON public.leaderboard_entries (score_total DESC, steps_completed DESC);

-- The website connects as skillsbridge_website. Grant only what it needs:
-- read the board, record a learner's totals, and read back the saved row.
GRANT SELECT, INSERT, UPDATE ON public.leaderboard_entries TO skillsbridge_website;

-- If the app connects with a different role, grant that role the same three
-- privileges, for example:
--   GRANT SELECT, INSERT, UPDATE ON public.leaderboard_entries TO app_role;
