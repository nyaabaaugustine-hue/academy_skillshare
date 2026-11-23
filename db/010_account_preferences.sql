-- Learner/account preferences used by the web settings and tutor surfaces.
-- Safe to run repeatedly: every statement is idempotent.

create table if not exists account_preferences (
  user_id text primary key,
  tutor_mode text not null default 'explain',
  reading_level text not null default 'standard',
  language text not null default 'en',
  reminders boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
