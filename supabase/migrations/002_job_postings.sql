-- ─── Add status to jobs ───────────────────────────────────────
alter table jobs
  add column if not exists status text not null default 'active'
  check (status in ('active', 'pending_payment', 'expired'));

-- Back-fill all existing rows (Greenhouse-synced + manual seeds)
update jobs set status = 'active' where status is null;

-- ─── Pending job postings (holds form data before payment) ────
create table if not exists pending_job_postings (
  id          text primary key default gen_random_uuid()::text,
  data        jsonb not null,
  tier        text not null check (tier in ('standard', 'featured')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
);

-- Auto-clean rows older than 24 hours (run via pg_cron or manually)
-- select cron.schedule('clean-pending-jobs', '0 * * * *',
--   $$ delete from pending_job_postings where expires_at < now(); $$);
