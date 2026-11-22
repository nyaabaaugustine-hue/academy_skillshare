-- Certificates, badges, physical award tracking, and project reports.

CREATE TABLE IF NOT EXISTS learner_awards (
  id serial primary key,
  learner_name text not null,
  learner_alias text not null default '',
  guardian_name text not null default '',
  guardian_email text not null default '',
  award_type text not null default 'certificate', -- certificate | badge | prize
  award_title text not null,
  award_detail text not null default '',
  milestone text not null default '',
  prize_item text not null default '',
  status text not null default 'awarded', -- awarded | delivered | pending
  consent_verified boolean not null default false,
  public_share boolean not null default false,
  share_token text not null unique,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS learner_awards_share_token_idx ON learner_awards (share_token);
CREATE INDEX IF NOT EXISTS learner_awards_issued_idx ON learner_awards (issued_at desc);

CREATE TABLE IF NOT EXISTS project_reports (
  id serial primary key,
  project_id integer,
  project_title text not null default '',
  reason text not null,
  details text not null default '',
  reporter_email text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);
