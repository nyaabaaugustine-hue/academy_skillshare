CREATE TABLE IF NOT EXISTS project_submissions (
  id serial primary key,
  learner_alias text not null,
  age_group text not null default '',
  guardian_name text not null default '',
  guardian_email text not null default '',
  project_title text not null,
  skill text not null default '',
  description text not null default '',
  project_url text not null default '',
  image_url text not null default '',
  consent_publish boolean not null default false,
  consent_guardian boolean not null default false,
  status text not null default 'new',
  admin_note text not null default '',
  created_at timestamptz not null default now()
);
