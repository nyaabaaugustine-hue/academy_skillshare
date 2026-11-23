-- Public/shareable Python playground snippets.
-- Safe to run repeatedly: every statement is idempotent.

create table if not exists playground_snippets (
  id bigserial primary key,
  user_id text,
  title text not null default 'Untitled snippet',
  code text not null,
  stdin text,
  language text not null default 'python',
  share_token text not null unique,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playground_snippets_user_created_idx
  on playground_snippets (user_id, created_at desc);
create index if not exists playground_snippets_created_idx
  on playground_snippets (created_at desc);
create index if not exists playground_snippets_token_idx
  on playground_snippets (share_token);
