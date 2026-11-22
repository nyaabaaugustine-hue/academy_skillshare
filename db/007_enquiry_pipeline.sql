-- Enquiry pipeline fields for admin workflow. Safe to run repeatedly.
alter table school_enquiries add column if not exists source text not null default 'website';
alter table school_enquiries add column if not exists assigned_to text;
alter table school_enquiries add column if not exists admin_note text;
alter table school_enquiries add column if not exists follow_up_at timestamptz;
alter table school_enquiries add column if not exists last_contacted_at timestamptz;
alter table school_enquiries add column if not exists updated_at timestamptz not null default now();

create index if not exists school_enquiries_status_idx on school_enquiries (status, created_at desc);
create index if not exists school_enquiries_follow_up_idx on school_enquiries (follow_up_at) where follow_up_at is not null;
create index if not exists school_enquiries_email_idx on school_enquiries (lower(email));
