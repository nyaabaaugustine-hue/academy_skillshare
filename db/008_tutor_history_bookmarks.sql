-- AI tutor conversation history and bookmarks for learners.
-- Safe to run repeatedly: every statement is idempotent.

-- One row per tutor conversation turn (message or response).
create table if not exists tutor_history (
  id bigserial primary key,
  user_id text not null,
  role text not null check (role in ('user','assistant','system')),
  message text not null,
  mode text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tutor_history_user_created_idx
  on tutor_history (user_id, created_at desc);
create index if not exists tutor_history_created_idx
  on tutor_history (created_at desc);

-- Bookmarked tutor answers a learner wants to keep.
create table if not exists tutor_bookmarks (
  id bigserial primary key,
  user_id text not null,
  history_id bigint not null references tutor_history(id) on delete cascade,
  title text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists tutor_bookmarks_user_idx
  on tutor_bookmarks (user_id, created_at desc);
create unique index if not exists tutor_bookmarks_unique
  on tutor_bookmarks (user_id, history_id);
