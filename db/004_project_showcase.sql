CREATE TABLE IF NOT EXISTS project_showcase (
  id serial primary key,
  title text not null,
  description text not null default '',
  learner_name text not null default '',
  skill text not null default '',
  image text not null default '',
  project_url text not null default '',
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
