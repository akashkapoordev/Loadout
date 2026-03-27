-- 1. Add is_premium column to content_items
alter table content_items
  add column if not exists is_premium boolean not null default false;

-- 2. Create subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz not null,
  created_at timestamptz default now()
);

-- One subscription row per user (conflict target for checkout.session.completed upsert)
create unique index if not exists subscriptions_user_id_idx on subscriptions(user_id);

-- RLS: users can read only their own row
alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);
-- No insert/update policies -- only the service-role webhook writes here

-- 3. Premium check function (public schema, NOT auth schema)
--    auth schema functions may be dropped by Supabase platform upgrades
create or replace function public.user_is_premium()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and current_period_end > now()
  )
$$;

-- 4. Content view with body masking (SECURITY INVOKER = runs as calling user,
--    so auth.uid() returns the correct user ID, not the view owner)
--    REQUIRES PostgreSQL 15+
create or replace view public_content_items
  with (security_invoker = true)
as
  select
    id, type, title, author_id, read_time, thumbnail,
    published_at, views, rating, tags, source_url, is_premium,
    -- body_teaser: first 300 chars always visible (used for blur preview on gated content)
    substring(body, 1, 300) as body_teaser,
    -- body: full content for free items or premium subscribers; null for gated content
    case
      when is_premium = false then body
      when public.user_is_premium() then body
      else null
    end as body
  from content_items;

-- Grant SELECT on view to both roles
-- Do NOT revoke SELECT on content_items table -- SECURITY INVOKER requires
-- the calling user to have table-level SELECT for the view to work
grant select on public_content_items to anon, authenticated;
