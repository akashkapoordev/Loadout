# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the complete Loadout backend — Supabase PostgreSQL schema, seed data, frontend API layer, and automated data sync pipeline feeding real gaming jobs and content.

**Architecture:** Supabase (hosted PostgreSQL + realtime) acts as the database and auth layer. The frontend reads data via the anon Supabase client. A Node/TypeScript sync script (run via GitHub Actions every 6 hours) uses the service role key to upsert data from six external APIs. No custom server — all reads are direct Supabase JS calls from the browser.

**Tech Stack:** Supabase JS v2, TypeScript 5.9, tsx (script runner), dotenv, GitHub Actions, Remotive API, Greenhouse API, Arbeitnow API, Reddit JSON API, Hashnode GraphQL API, Dev.to REST API.

---

## File Map

| File | Responsibility |
|---|---|
| `supabase/schema.sql` | All table definitions + RLS policies (run once in Supabase SQL Editor) |
| `supabase/seed.sql` | Curated studios, authors, and initial platform_stats |
| `supabase/seed-content.sql` | Sample jobs and content items for local dev/preview |
| `src/lib/types.ts` | All TypeScript domain types, filter interfaces, response shapes |
| `src/lib/supabase.ts` | Supabase anon client (for browser reads) |
| `src/lib/api.ts` | All data-fetching functions + snake_case→camelCase mappers |
| `scripts/sync.ts` | Automated data pipeline: fetch → filter → upsert → stats → prune |
| `.github/workflows/sync.yml` | GitHub Actions: run sync every 6 hours |
| `.env` | Local env vars (gitignored) |
| `.gitignore` | Protects `.env` from being committed |

---

### Task 1: Environment Setup

**Files:**
- Create: `.env`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Add `.env` to `.gitignore`**

Ensure `.gitignore` contains:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 2: Create `.env` with required vars**

```bash
# Frontend (Vite injects these — prefix VITE_)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Sync script (server-side only — no VITE_ prefix)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

- [ ] **Step 3: Add `sync` script to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "sync": "tsx scripts/sync.ts"
}
```

- [ ] **Step 4: Install sync script dev dependencies**

```bash
npm install -D tsx dotenv @types/node
```

- [ ] **Step 5: Verify `npm run sync` resolves without crashing**

Expected: Script starts and prints `━━━ Loadout sync starting...`

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: add sync script and env setup"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define domain types**

```typescript
export interface Author {
  id: string
  name: string
  avatar?: string
  role: string
  bio: string
  twitter?: string
  linkedin?: string
}

export type ContentType = 'tutorial' | 'article' | 'devlog' | 'guide'

export interface ContentItem {
  id: string
  type: ContentType
  title: string
  authorId: string
  readTime: number
  thumbnail?: string
  publishedAt: string
  views: number
  rating: number
  tags: string[]
  body: string
  sourceUrl?: string
}

export interface ContentItemWithAuthor extends ContentItem {
  author?: Author
}

export type Discipline =
  | 'Game Design' | 'Engineering' | 'Art & VFX'
  | 'Marketing'   | 'Audio'       | 'Writing'
  | 'Production'  | 'Analytics'

export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead'
export type SalaryBand = '<$60k' | '$60-100k' | '$100-150k' | '$150k+'
export type JobTag = 'new' | 'hot' | 'featured' | 'remote'

export interface Job {
  id: string
  studioId: string
  title: string
  company: string
  companyLogo: string
  companyColor: string
  location: string
  remote: boolean
  discipline: Discipline
  experienceLevel: ExperienceLevel
  salaryBand?: SalaryBand
  salary?: string
  tags: JobTag[]
  postedAt: string
  description: string
  applyUrl: string
}

export interface Studio {
  id: string
  name: string
  logoInitials: string
  logoColor: string
  logoBg: string
  location: string
  description: string
  website?: string
  twitter?: string
  linkedin?: string
  founded?: number
  disciplines: Discipline[]
}

export type ActivityType = 'job_posted' | 'studio_joined' | 'content_published'
export type ActivityColor = 'orange' | 'cyan' | 'green'

export interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  highlight: string
  color: ActivityColor
  createdAt: string
}

export interface PlatformStats {
  openRoles: number
  studios: number
  members: number
  articles: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface SingleResponse<T> {
  data: T
}

export interface JobFilters {
  discipline?: Discipline
  disciplines?: Discipline[]
  remote?: boolean
  salaryBand?: SalaryBand
  experienceLevel?: ExperienceLevel
  location?: string
  studioId?: string
  page?: number
  limit?: number
}

export interface ContentFilters {
  type?: ContentType
  tags?: string[]
  sort?: 'latest' | 'most-viewed' | 'top-rated'
  page?: number
  limit?: number
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add domain types"
```

---

### Task 3: Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create anon client**

```typescript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
```

- [ ] **Step 2: Verify build passes**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add supabase client"
```

---

### Task 4: Database Schema — Core Tables

**Files:**
- Create: `supabase/schema.sql`

Run this entire file once in Supabase → SQL Editor.

- [ ] **Step 1: Write schema**

```sql
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

-- ─── STUDIO WAITLIST ────────────────────────────────────────
create table if not exists studio_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
alter table studios          enable row level security;
alter table authors          enable row level security;
alter table jobs             enable row level security;
alter table content_items    enable row level security;
alter table activity_items   enable row level security;
alter table platform_stats   enable row level security;
alter table studio_waitlist  enable row level security;

create policy "public read studios"       on studios          for select using (true);
create policy "public read authors"       on authors          for select using (true);
create policy "public read jobs"          on jobs             for select using (true);
create policy "public read content"       on content_items    for select using (true);
create policy "public read activity"      on activity_items   for select using (true);
create policy "public read stats"         on platform_stats   for select using (true);
create policy "anon insert waitlist"      on studio_waitlist  for insert with check (true);
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Paste and execute. Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add database schema with all tables and RLS"
```

---

### Task 5: Seed Data

**Files:**
- Create: `supabase/seed.sql`
- Create: `supabase/seed-content.sql`

- [ ] **Step 1: Create `supabase/seed.sql`**

Contains: 6 gaming studios (Riot, Naughty Dog, CD Projekt Red, Ubisoft Toronto, Insomniac, Hello Games), 5 authors, and initial platform_stats row. All use `on conflict (id) do nothing`.

- [ ] **Step 2: Create `supabase/seed-content.sql`**

Contains: 12 sample jobs tied to the seeded studios, 12 sample content items (tutorials, articles, devlogs, guides) with full body text. All use `on conflict (id) do nothing`.

- [ ] **Step 3: Run both files in Supabase SQL Editor**

Expected: "Success. X rows affected."

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql supabase/seed-content.sql
git commit -m "feat: add curated seed data for studios, authors, and content"
```

---

### Task 6: API Layer

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Write query functions**

All functions return `Promise<PaginatedResponse<T>>` or `Promise<SingleResponse<T>>`.

```typescript
// Jobs
fetchJobs(filters?: JobFilters)      // paginated, filterable by discipline/remote/salary/exp/location/studio
fetchJob(id: string)                 // single job

// Studios
fetchStudios()                       // all studios ordered by name
fetchStudio(id: string)              // single studio
fetchStudioJobs(id: string)          // all jobs for a studio

// Content
fetchContent(filters?: ContentFilters)         // paginated, filterable by type/tags, sortable
fetchContentItem(id: string)                   // single item with joined author
fetchTrending()                                // top 4 by views
fetchFeatured()                                // #1 by rating

// Supporting
fetchAuthor(id: string)
fetchActivity()                      // latest 10 activity items
fetchStats()                         // platform_stats row id=1
```

- [ ] **Step 2: Write snake_case → camelCase mappers**

One mapper per table: `mapJob`, `mapStudio`, `mapContent`, `mapAuthor`, `mapActivity`. Each takes a raw DB row (`any`) and returns the typed domain object.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add API layer with all query functions and mappers"
```

---

### Task 7: Data Sync Script

**Files:**
- Create: `scripts/sync.ts`

The sync script uses the **service role** Supabase client (bypasses RLS) and reads env vars via `dotenv`.

- [ ] **Step 1: Bootstrap client and helpers**

```typescript
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
```

- [ ] **Step 2: Add shared helpers**

- `colorFromString(s)` — deterministic HSL color from any string
- `initials(name)` — up to 2 initials from company name
- `experienceLevel(title)` — 'Junior' | 'Mid' | 'Senior' | 'Lead' from title keywords
- `mapDiscipline(category)` — Remotive category → Loadout discipline
- `mapGreenhouseDepartment(dept)` — Greenhouse dept → Loadout discipline
- `isGameRelated(title, company, tags)` — regex filter for gaming jobs
- `isGameContent(title, tags)` — regex filter for game dev content
- `contentType(tags, title)` — classify as 'tutorial' | 'article' | 'devlog' | 'guide'
- `decodeHtmlEntities(s)` — unescape `&amp;` etc.

- [ ] **Step 3: Implement `syncJobs()` — Remotive**

Fetches 12 search queries (game developer, designer, artist, Unity, Unreal, Godot, etc.), deduplicates by ID, filters with `isGameRelated`, maps to DB rows, upserts, writes activity items for new jobs (cap 10/sync).

- [ ] **Step 4: Implement `syncJobsGreenhouse()` — Greenhouse**

Fetches boards for 10 game studios (Riot, Epic, Bungie, 2K, Zynga, Roblox, Supercell, Unity, Discord, Activision), filters with `isGameRelated`, upserts with `source: 'greenhouse'`.

- [ ] **Step 5: Implement `syncJobsArbeitnow()` — Arbeitnow**

Fetches 6 search terms × 2 pages each, filters with `isGameRelated`, upserts with `source: 'arbeitnow'`. Rate-limit: 1200ms between requests.

- [ ] **Step 6: Implement `syncReddit()` — Reddit JSON API**

Fetches top-of-month posts from 6 subreddits: `gamedev`, `indiedev`, `unity3d`, `unrealengine`, `godot`, `gamedesign`. Score × 10 = views. Rate-limit: 2000ms between subreddits.

- [ ] **Step 7: Implement `syncHashnode()` — Hashnode GraphQL**

Queries 7 tags via `https://gql.hashnode.com` GraphQL API. Fetches title, brief, coverImage, readTimeInMinutes, publishedAt, tags. Rate-limit: 500ms between tags.

- [ ] **Step 8: Implement `syncContent()` — Dev.to**

Fetches 12 tag searches, filters with `isGameContent`, maps to content_items rows with `source: 'devto'`. Rate-limit: 400ms between requests.

- [ ] **Step 9: Implement cleanup and maintenance functions**

- `cleanNonGameJobs()` — scans jobs in 1000-row batches, deletes any where `isGameRelated` returns false
- `cleanNonGameContent()` — same for content_items
- `refreshStats()` — parallel count queries for jobs/articles/studios, upserts platform_stats id=1 (preserves `members`)
- `pruneActivity()` — selects activity items ranked 100+, deletes them

- [ ] **Step 10: Wire `main()` and test locally**

```typescript
async function main() {
  console.log('━━━ Loadout sync starting', new Date().toISOString(), '━━━')
  await syncJobs()
  await syncJobsGreenhouse()
  await syncJobsArbeitnow()
  await syncReddit()
  await syncHashnode()
  await syncContent()
  await cleanNonGameJobs()
  await cleanNonGameContent()
  await refreshStats()
  await pruneActivity()
  console.log('━━━ Sync complete ━━━')
}

main().catch(e => { console.error(e); process.exit(1) })
```

Run: `npm run sync`
Expected: each function logs `✓` lines, no `✗` errors.

- [ ] **Step 11: Commit**

```bash
git add scripts/sync.ts
git commit -m "feat: add automated data sync script (Remotive, Greenhouse, Arbeitnow, Reddit, Hashnode, Dev.to)"
```

---

### Task 8: GitHub Actions — Scheduled Sync

**Files:**
- Create: `.github/workflows/sync.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Sync Data

on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run data sync
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run sync
```

- [ ] **Step 2: Add GitHub Secrets**

In GitHub → repo → Settings → Secrets and variables → Actions:
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key (rotate first if previously exposed)

- [ ] **Step 3: Trigger manually to verify**

GitHub → Actions → Sync Data → Run workflow. Check logs for `✓` lines.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/sync.yml
git commit -m "feat: add GitHub Actions workflow for scheduled sync every 6 hours"
```

---

## Alignment Status

| Task | Description | Status |
|---|---|---|
| 1 | Environment Setup | ✅ Complete |
| 2 | TypeScript Types | ✅ Complete |
| 3 | Supabase Client | ✅ Complete |
| 4 | Database Schema (core tables + RLS) | ⚠️ Gap — `studio_waitlist` missing from `schema.sql` |
| 5 | Seed Data | ✅ Complete |
| 6 | API Layer | ✅ Complete |
| 7 | Data Sync Script | ✅ Complete |
| 8 | GitHub Actions | ✅ Complete |

### Gap Found: `studio_waitlist` not in `schema.sql`

The `studio_waitlist` table is used in `src/pages/ForStudiosPage.tsx` (email waitlist form) but is **not** defined in `supabase/schema.sql`. It was created manually via the Supabase SQL Editor in a prior session.

**Fix:** Add the table definition and its RLS policy to `schema.sql` so that anyone setting up the project from scratch gets the complete schema.
