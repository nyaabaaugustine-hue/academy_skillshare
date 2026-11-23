-- In-app notifications and web-push subscriptions.
-- Safe to run repeatedly: every statement is idempotent.

create table if not exists notifications (
  id bigserial primary key,
  user_id text not null,
  title text not null,
  body text,
  type text not null default 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on notifications (user_id, read_at) where read_at is null;

create table if not exists push_subscriptions (
  id bigserial primary key,
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions (user_id, created_at desc);
