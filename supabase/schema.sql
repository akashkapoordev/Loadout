-- ─── STUDIOS ───────────────────────────────────────────────
create table if not exists studios (
  id text primary key,
  name text not null,
  logo_initials text not null,
  logo_color text not null,
  logo_bg text not null,
  location text not null,
  description text not null,
  website text,
  twitter text,
  linkedin text,
  founded integer,
  disciplines text[] not null default '{}'
);

-- ─── AUTHORS ────────────────────────────────────────────────
create table if not exists authors (
  id text primary key,
  name text not null,
  avatar text,
  role text not null,
  bio text not null,
  twitter text,
  linkedin text
);

-- ─── JOBS ───────────────────────────────────────────────────
create table if not exists jobs (
  id text primary key,
  studio_id text references studios(id),
  title text not null,
  company text not null,
  company_logo text not null,
  company_color text not null,
  location text not null,
  remote boolean not null default false,
  discipline text not null,
  experience_level text not null,
  salary_band text,
  salary text,
  tags text[] not null default '{}',
  posted_at timestamptz not null default now(),
  description text not null,
  apply_url text not null,
  source text default 'manual'
);

-- ─── CONTENT ITEMS ──────────────────────────────────────────
create table if not exists content_items (
  id text primary key,
  type text not null check (type in ('tutorial','article','devlog','guide')),
  title text not null,
  author_id text references authors(id),
  read_time integer not null default 5,
  thumbnail text,
  published_at timestamptz not null default now(),
  views integer not null default 0,
  rating numeric(3,1) not null default 0,
  tags text[] not null default '{}',
  body text not null default '',
  source_url text,
  source text default 'manual'
);

-- ─── ACTIVITY ───────────────────────────────────────────────
create table if not exists activity_items (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  message text not null,
  highlight text not null,
  color text not null,
  created_at timestamptz not null default now()
);

-- ─── PLATFORM STATS ─────────────────────────────────────────
create table if not exists platform_stats (
  id integer primary key default 1,
  open_roles integer not null default 0,
  studios integer not null default 0,
  members integer not null default 0,
  articles integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into platform_stats (id, open_roles, studios, members, articles)
values (1, 0, 0, 0, 0)
on conflict (id) do nothing;

-- ─── ROW LEVEL SECURITY (read-only public) ──────────────────
alter table studios enable row level security;
alter table authors enable row level security;
alter table jobs enable row level security;
alter table content_items enable row level security;
alter table activity_items enable row level security;
alter table platform_stats enable row level security;

create policy "public read studios"       on studios       for select using (true);
create policy "public read authors"       on authors       for select using (true);
create policy "public read jobs"          on jobs          for select using (true);
create policy "public read content"       on content_items for select using (true);
create policy "public read activity"      on activity_items for select using (true);
create policy "public read stats"         on platform_stats for select using (true);
