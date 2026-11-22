CREATE TABLE IF NOT EXISTS upcoming_trainings (
  id serial primary key,
  type text not null default 'TRAINING',
  title text not null,
  date_label text not null default '',
  duration text not null default '',
  format text not null default '',
  image text not null default '',
  description text not null default '',
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
