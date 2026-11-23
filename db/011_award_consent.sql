-- Guardian consent workflow for public certificate pages.
-- Safe to run repeatedly: every statement is idempotent.

alter table learner_awards add column if not exists consent_requested_at timestamptz;
alter table learner_awards add column if not exists consent_responded_at timestamptz;
alter table learner_awards add column if not exists consent_note text;

create index if not exists learner_awards_consent_idx
  on learner_awards (consent_verified, consent_requested_at desc);
