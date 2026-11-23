-- Centralized notification campaigns, FCM device registration, deliveries, preferences.
-- Safe to run repeatedly: every statement is idempotent.

create extension if not exists "pgcrypto";

create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  fcm_token text not null unique,
  platform text not null check (platform in ('android','ios','web')),
  device_name text,
  app_version text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_devices_user_idx on user_devices (user_id, is_active);
create index if not exists user_devices_platform_idx on user_devices (platform, is_active);

create table if not exists notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text,
  title text not null,
  message text not null,
  image_url text,
  action_url text,
  category text not null default 'general',
  audience_type text not null default 'all',
  audience_filter jsonb not null default '{}'::jsonb,
  platform_filter jsonb not null default '["android","ios","web"]'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','processing','completed','partially_completed','failed','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by text,
  idempotency_key text unique,
  targeted_users integer not null default 0,
  targeted_devices integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_campaigns_status_idx on notification_campaigns (status, scheduled_at);
create index if not exists notification_campaigns_created_idx on notification_campaigns (created_at desc);

create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references notification_campaigns(id) on delete cascade,
  notification_id bigint references notifications(id) on delete set null,
  device_id uuid references user_devices(id) on delete set null,
  user_id text not null,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','processing','accepted_by_fcm','failed','invalid_token')),
  provider_message_id text,
  error_code text,
  error_message text,
  attempt_count integer not null default 0,
  attempted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_deliveries_campaign_idx on notification_deliveries (campaign_id, delivery_status);
create index if not exists notification_deliveries_user_idx on notification_deliveries (user_id, created_at desc);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  category text not null,
  push_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

create index if not exists notification_preferences_user_idx on notification_preferences (user_id);

alter table notifications add column if not exists campaign_id uuid references notification_campaigns(id) on delete set null;
create index if not exists notifications_campaign_idx on notifications (campaign_id);
