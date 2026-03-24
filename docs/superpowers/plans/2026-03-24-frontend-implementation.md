# Loadout Frontend — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Loadout frontend — a dark-themed gaming industry job board and content platform — from a blank Vite scaffold to a fully functional, responsive, Supabase-connected React app.

**Architecture:** React 18 + TypeScript + Vite. Data via Supabase JS client (no generated types — raw queries with manual camelCase mappers). Server-state caching via TanStack React Query. Page transitions via Framer Motion. Responsive layout via a custom `useBreakpoint` hook (no media queries in JS — width checks only). All styling is CSS-in-JS inline styles + CSS variables defined in `index.css`. No component library — all UI is hand-built.

**Tech Stack:** React 19, TypeScript 5.9, React Router v7, TanStack React Query v5, Framer Motion v12, Supabase JS v2, Vite 8, Tailwind CSS v4 (utility reset only)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/index.css` | **Create** | Design tokens (CSS vars), global reset, font declarations |
| `src/main.tsx` | **Create** | React entry — QueryClientProvider wrapping App |
| `src/App.tsx` | **Create** | All route definitions via React Router v7 |
| `src/lib/supabase.ts` | **Create** | Supabase client singleton |
| `src/lib/types.ts` | **Create** | All TypeScript domain interfaces and union types |
| `src/lib/api.ts` | **Create** | All Supabase fetch functions with snake_case → camelCase mappers |
| `src/hooks/useBreakpoint.ts` | **Create** | Window resize → isMobile / isTablet / isDesktop booleans |
| `src/hooks/useJobs.ts` | **Create** | useQuery + useInfiniteQuery for job listings |
| `src/hooks/useStudios.ts` | **Create** | useQuery for studios list + single studio + studio jobs |
| `src/hooks/useContent.ts` | **Create** | useQuery + useInfiniteQuery for content; featured + trending variants |
| `src/hooks/useStats.ts` | **Create** | useQuery for platform stats, 10 min stale time |
| `src/hooks/useActivity.ts` | **Create** | useQuery for activity feed, polls every 30s |
| `src/components/Layout.tsx` | **Create** | Root layout: Nav + animated Outlet + Footer |
| `src/components/Nav.tsx` | **Create** | Sticky nav with logo, links, desktop CTAs, mobile hamburger drawer |
| `src/components/Footer.tsx` | **Create** | 4-column footer: branding + 3 link sections + copyright |
| `src/components/PageHeader.tsx` | **Create** | Section heading with orange left bar + optional action slot |
| `src/components/PageTransition.tsx` | **Create** | Framer Motion fade+Y wrapper for page entrance/exit |
| `src/components/StatBlock.tsx` | **Create** | Right-aligned stat: large orange value + small label |
| `src/components/CalloutCard.tsx` | **Create** | CTA card: icon + title + description + full-width button |
| `src/components/DisciplineFilter.tsx` | **Create** | Horizontal scrolling discipline pill filter bar |
| `src/components/JobCard.tsx` | **Create** | Job list row: logo + title/meta + tags/salary |
| `src/components/StudioRow.tsx` | **Create** | Studio list row: logo initials + name + open roles + chevron |
| `src/components/ContentCard.tsx` | **Create** | Content card: gradient thumbnail + type badge + title + meta |
| `src/components/ContentTypeBadge.tsx` | **Create** | Inline badge for tutorial / article / dev log / guide |
| `src/components/ActivityFeed.tsx` | **Create** | Vertical activity list with animated colored dots |
| `src/components/LiveTicker.tsx` | **Create** | Scrolling marquee with LIVE badge |
| `src/components/TrendingList.tsx` | **Create** | Numbered list (01–04) of trending content items |
| `src/pages/HomePage.tsx` | **Create** | Hero + discipline filter + featured jobs + content tabs + sidebar |
| `src/pages/JobsPage.tsx` | **Create** | Filterable job list with infinite scroll |
| `src/pages/JobDetailPage.tsx` | **Create** | Job detail: header + description + apply CTA + similar jobs sidebar |
| `src/pages/StudiosPage.tsx` | **Create** | Studio grid with search + discipline filter |
| `src/pages/StudioDetailPage.tsx` | **Create** | Studio header + stats + open roles + disciplines sidebar |
| `src/pages/ContentListPage.tsx` | **Create** | Reusable content list: tag filter + sort + infinite scroll |
| `src/pages/TutorialsPage.tsx` | **Create** | ContentListPage wrapper for type='tutorial' |
| `src/pages/ArticlesPage.tsx` | **Create** | ContentListPage wrapper for type='article' |
| `src/pages/DevLogsPage.tsx` | **Create** | ContentListPage wrapper for type='devlog' |
| `src/pages/GuidesPage.tsx` | **Create** | ContentListPage wrapper for type='guide' |
| `src/pages/ContentDetailPage.tsx` | **Create** | Full article: markdown renderer + author card + related + trending |
| `src/pages/ForStudiosPage.tsx` | **Create** | Coming soon page with feature cards + email waitlist form |

---

## Task 1: Project Scaffold & Dependencies

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`

- [ ] **Step 1: Scaffold with Vite**

```bash
npm create vite@latest loadout -- --template react-ts
cd loadout
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @tanstack/react-query framer-motion react-router-dom
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tailwindcss @tailwindcss/vite tsx dotenv
```

- [ ] **Step 4: Delete Vite scaffold boilerplate**

Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`

**Expected state:** `src/` contains only `main.tsx`, `App.tsx`, `index.css`, `vite-env.d.ts`

- [ ] **Step 5: Configure Tailwind in vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: project scaffold with Vite + React + TS + Tailwind + Supabase"
```

---

## Task 2: Design System (index.css)

**Files:** `src/index.css`

- [ ] **Step 1: Replace index.css with design tokens + global reset**

```css
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg: #080810;
  --bg2: #0D0D18;
  --surface: #111120;
  --surface2: #181828;

  /* Borders */
  --border: #1E1E35;
  --border2: #28283F;

  /* Text */
  --text: #F0F0FF;
  --sub: #8888AA;
  --muted: #55556A;

  /* Accent */
  --orange: #FF5C00;
  --cyan: #00D4FF;
  --purple: #9D60FF;
  --green: #39FF83;
  --red: #FF3A3A;
  --amber: #FFB830;

  /* Derived */
  --accent: var(--orange);
  --accent-mid: rgba(255, 92, 0, 0.4);
  --accent-dim: rgba(255, 92, 0, 0.08);

  /* Typography */
  --font-display: 'Barlow Condensed', sans-serif;
  --font-ui: 'Rajdhani', sans-serif;
  --font-body: 'Inter', sans-serif;
  --mono: ui-monospace, Consolas, monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.5;
}

#root {
  min-height: 100dvh;
}
```

- [ ] **Step 2: Add Google Fonts to index.html**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: design tokens, global reset, Google Fonts"
```

---

## Task 3: Type Definitions

**Files:** `src/lib/types.ts`

- [ ] **Step 1: Create all domain types**

```ts
export type ContentType = 'tutorial' | 'article' | 'devlog' | 'guide'

export type Discipline =
  | 'Game Design' | 'Engineering' | 'Art & VFX'
  | 'Marketing' | 'Audio' | 'Writing' | 'Production' | 'Analytics'

export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead'

export type SalaryBand = '<$60k' | '$60-100k' | '$100-150k' | '$150k+'

export type JobTag = 'new' | 'hot' | 'featured' | 'remote'

export type ActivityType = 'job_posted' | 'studio_joined' | 'content_published'

export type ActivityColor = 'orange' | 'cyan' | 'green'

export interface Author {
  id: string
  name: string
  avatar?: string
  role: string
  bio: string
  twitter?: string
  linkedin?: string
}

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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface SingleResponse<T> {
  data: T
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: TypeScript domain types for all entities"
```

---

## Task 4: Supabase Client & API Layer

**Files:** `src/lib/supabase.ts`, `src/lib/api.ts`, `.env`

- [ ] **Step 1: Create .env file**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 2: Create Supabase client**

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
```

- [ ] **Step 3: Create API layer with all fetch functions**

Key patterns for `src/lib/api.ts`:

```ts
import { supabase } from './supabase'
import type { Job, Studio, ContentItem, ContentItemWithAuthor,
  Author, ActivityItem, PlatformStats, JobFilters, ContentFilters,
  PaginatedResponse, SingleResponse } from './types'

// --- Mappers (snake_case DB → camelCase TS) ---

function mapJob(r: Record<string, unknown>): Job { /* ... */ }
function mapStudio(r: Record<string, unknown>): Studio { /* ... */ }
function mapContent(r: Record<string, unknown>): ContentItem { /* ... */ }
function mapAuthor(r: Record<string, unknown>): Author { /* ... */ }
function mapActivity(r: Record<string, unknown>): ActivityItem { /* ... */ }

// --- Jobs ---
export async function fetchJobs(filters: JobFilters): Promise<PaginatedResponse<Job>> { /* ... */ }
export async function fetchJob(id: string): Promise<SingleResponse<Job>> { /* ... */ }
export async function fetchStudioJobs(studioId: string): Promise<PaginatedResponse<Job>> { /* ... */ }

// --- Studios ---
export async function fetchStudios(): Promise<SingleResponse<Studio[]>> { /* ... */ }
export async function fetchStudio(id: string): Promise<SingleResponse<Studio>> { /* ... */ }

// --- Content ---
export async function fetchContent(filters: ContentFilters): Promise<PaginatedResponse<ContentItem>> { /* ... */ }
export async function fetchContentItem(id: string): Promise<SingleResponse<ContentItemWithAuthor>> { /* ... */ }
export async function fetchTrending(): Promise<SingleResponse<ContentItem[]>> { /* ... */ }
export async function fetchFeatured(): Promise<SingleResponse<ContentItem>> { /* ... */ }

// --- Activity ---
export async function fetchActivity(): Promise<SingleResponse<ActivityItem[]>> { /* ... */ }

// --- Stats ---
export async function fetchStats(): Promise<SingleResponse<PlatformStats>> { /* ... */ }
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/api.ts .env
git commit -m "feat: Supabase client and full API layer"
```

---

## Task 5: Hooks

**Files:** `src/hooks/useBreakpoint.ts`, `useJobs.ts`, `useStudios.ts`, `useContent.ts`, `useStats.ts`, `useActivity.ts`

- [ ] **Step 1: useBreakpoint**

```ts
// src/hooks/useBreakpoint.ts
import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1280,
    isDesktop: width >= 1280,
  }
}
```

- [ ] **Step 2: useJobs**

```ts
// src/hooks/useJobs.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchJobs, fetchJob } from '../lib/api'
import type { JobFilters } from '../lib/types'

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => fetchJobs(filters),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => fetchJob(id),
    enabled: !!id,
  })
}

export function useJobsInfinite(filters: Omit<JobFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchJobs({ ...filters, page: pageParam as number, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const fetched = (last.page - 1) * last.limit + last.data.length
      return fetched < last.total ? last.page + 1 : undefined
    },
  })
}
```

- [ ] **Step 3: useStudios**

```ts
// src/hooks/useStudios.ts
import { useQuery } from '@tanstack/react-query'
import { fetchStudios, fetchStudio, fetchStudioJobs } from '../lib/api'

export function useStudios() {
  return useQuery({ queryKey: ['studios'], queryFn: fetchStudios })
}

export function useStudio(id: string) {
  return useQuery({
    queryKey: ['studios', id],
    queryFn: () => fetchStudio(id),
    enabled: !!id,
  })
}

export function useStudioJobs(id: string) {
  return useQuery({
    queryKey: ['studios', id, 'jobs'],
    queryFn: () => fetchStudioJobs(id),
    enabled: !!id,
  })
}
```

- [ ] **Step 4: useContent**

```ts
// src/hooks/useContent.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchContent, fetchContentItem, fetchTrending, fetchFeatured } from '../lib/api'
import type { ContentFilters } from '../lib/types'

export function useContent(filters: ContentFilters = {}) {
  return useQuery({
    queryKey: ['content', filters],
    queryFn: () => fetchContent(filters),
    staleTime: 5 * 60 * 1000,
  })
}

export function useContentInfinite(filters: Omit<ContentFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['content', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchContent({ ...filters, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const fetched = (last.page - 1) * last.limit + last.data.length
      return fetched < last.total ? last.page + 1 : undefined
    },
  })
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContentItem(id),
    enabled: !!id,
  })
}

export function useTrending() {
  return useQuery({ queryKey: ['content', 'trending'], queryFn: fetchTrending })
}

export function useFeatured() {
  return useQuery({ queryKey: ['content', 'featured'], queryFn: fetchFeatured })
}
```

- [ ] **Step 5: useStats**

```ts
// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '../lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 10 * 60 * 1000,
  })
}
```

- [ ] **Step 6: useActivity**

```ts
// src/hooks/useActivity.ts
import { useQuery } from '@tanstack/react-query'
import { fetchActivity } from '../lib/api'

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
    refetchInterval: 30 * 1000,
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/
git commit -m "feat: all data hooks (useBreakpoint, useJobs, useStudios, useContent, useStats, useActivity)"
```

---

## Task 6: Layout Shell (Nav, Footer, Layout)

**Files:** `src/components/Nav.tsx`, `src/components/Footer.tsx`, `src/components/Layout.tsx`, `src/components/PageTransition.tsx`

- [ ] **Step 1: Create PageTransition wrapper**

```tsx
// src/components/PageTransition.tsx
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create Nav**

Key requirements:
- Sticky top, `z-index: 50`, dark background with border-bottom
- Logo: "LOADOUT" in display font
- Desktop nav links: Home, Jobs, Studios, Tutorials, Articles, Dev Logs, Guides
- Desktop CTAs: "Post a Job" (outline) → `/for-studios`, "Get Hired" (orange fill) → `/jobs`
- Mobile: hamburger icon → full-screen drawer with all nav links + both CTA buttons
- `useNavigate` for programmatic navigation on CTA buttons

- [ ] **Step 3: Create Footer**

Key requirements:
- 4 columns on desktop, stacked on mobile
- Column 1: Logo + tagline + copyright
- Column 2: "Explore" links (Jobs, Studios, Tutorials, Articles, Dev Logs, Guides)
- Column 3: "For Studios" links (Post a Job, Studio Profile, Pricing) → all `/for-studios`
- Column 4: "Company" links (About, Contact, Privacy, Terms)
- All links use React Router `<Link>`

- [ ] **Step 4: Create Layout**

```tsx
// src/components/Layout.tsx
import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/components/Footer.tsx src/components/Layout.tsx src/components/PageTransition.tsx
git commit -m "feat: layout shell — Nav, Footer, Layout, PageTransition"
```

---

## Task 7: Shared UI Components

**Files:** `src/components/PageHeader.tsx`, `src/components/StatBlock.tsx`, `src/components/CalloutCard.tsx`

- [ ] **Step 1: PageHeader**

```tsx
// src/components/PageHeader.tsx
import type { ReactNode } from 'react'

interface Props {
  title: string
  action?: ReactNode
}

export default function PageHeader({ title, action }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, background: 'var(--orange)', borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--sub)' }}>
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}
```

- [ ] **Step 2: StatBlock**

```tsx
// src/components/StatBlock.tsx
interface Props { value: string; label: string }

export default function StatBlock({ value, label }: Props) {
  return (
    <div style={{ textAlign: 'right', padding: '16px 20px' }}>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--orange)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
        {label}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: CalloutCard**

```tsx
// src/components/CalloutCard.tsx
interface Props {
  icon: string
  title: string
  description: string
  buttonLabel: string
  onClick: () => void
}

export default function CalloutCard({ icon, title, description, buttonLabel, onClick }: Props) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5, marginBottom: 16 }}>{description}</p>
      <button
        onClick={onClick}
        style={{ width: '100%', padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 16px rgba(255,92,0,0.3)' }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PageHeader.tsx src/components/StatBlock.tsx src/components/CalloutCard.tsx
git commit -m "feat: shared UI components — PageHeader, StatBlock, CalloutCard"
```

---

## Task 8: Domain Components

**Files:** `src/components/JobCard.tsx`, `src/components/DisciplineFilter.tsx`, `src/components/StudioRow.tsx`, `src/components/ContentCard.tsx`, `src/components/ContentTypeBadge.tsx`, `src/components/ActivityFeed.tsx`, `src/components/LiveTicker.tsx`, `src/components/TrendingList.tsx`

- [ ] **Step 1: ContentTypeBadge**

Color map: tutorial→cyan, article→purple, devlog→amber, guide→green. Displays uppercase type label in colored pill.

- [ ] **Step 2: JobCard**

Requirements:
- 44px logo square with initials + background color from `job.companyColor` / `job.companyLogo` fields
- Title, company name, location/remote pill, experience level
- Tags as small colored pills (new=orange, hot=red, featured=purple, remote=cyan)
- Salary range right-aligned
- Hover: slight background lift
- Entire card is a React Router `<Link>` to `/jobs/:id`

- [ ] **Step 3: DisciplineFilter**

Requirements:
- Horizontal scrollable row of pills: "All Roles" + 8 discipline names
- Active pill: orange background, white text
- Inactive pill: transparent background, border
- `active: Discipline | null` + `onChange: (d: Discipline | null) => void`

- [ ] **Step 4: StudioRow**

Requirements:
- 40px logo square with initials + colors from studio
- Studio name + location
- Open roles count right-aligned
- Chevron →
- `<Link>` to `/studios/:id`

- [ ] **Step 5: ContentCard**

Requirements:
- 140px tall thumbnail — gradient fallback if no `thumbnail` URL
- ContentTypeBadge overlaid
- Title, date, read time, view count
- Optional `featured` prop — larger layout
- `<Link>` to `/:type/:id` (e.g. `/tutorials/:id`)

- [ ] **Step 6: ActivityFeed**

Requirements:
- Calls `useActivity()` hook
- Each item: colored blinking dot + message with bold highlight word
- Dot colors: orange/cyan/green based on `item.color`
- Pulsing dot animation via CSS keyframes

- [ ] **Step 7: LiveTicker**

Requirements:
- Full-width dark bar with "● LIVE" badge on left
- Scrolling marquee of activity messages (CSS `@keyframes marquee`)
- Auto-scrolls continuously, pauses on hover

- [ ] **Step 8: TrendingList**

Requirements:
- Calls `useTrending()` hook
- 4 items numbered 01–04
- ContentTypeBadge + title
- `<Link>` to `/:type/:id`

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: all domain components — JobCard, ContentCard, StudioRow, activity/trending widgets"
```

---

## Task 9: HomePage

**File:** `src/pages/HomePage.tsx`

- [ ] **Step 1: Build the page**

Layout: hero (left copy + right stats panel) → discipline filter → two-column grid (left: jobs + content tabs, right: sidebar)

Hero left:
- Animated (Framer Motion stagger) badge + H1 + subtext + two CTA buttons
- "Browse Open Roles" → `/jobs` (orange fill), "Explore Studios" → `/studios` (outline)

Hero right stats panel:
- 4 StatBlocks: Open Roles, Studios Listed, Professionals, Articles Published
- Populated from `useStats()`

Left column (bordered right on desktop):
- Featured Jobs: `useJobs({ discipline, limit: 6 })` with `DisciplineFilter`
- "View all N roles →" link to `/jobs`
- Content tabs: Tutorials / Articles / Dev Logs / Guides (each calls `useContent({ type, limit: 5 })`)

Right sidebar:
- Live Activity: `<ActivityFeed />`
- Hiring Now: `useStudios()` top 4 with `<StudioRow>`
- Trending: `<TrendingList />`
- Post a Job CTA: `<CalloutCard>` → `navigate('/for-studios')`

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: HomePage with hero, discipline filter, featured jobs, content tabs, sidebar"
```

---

## Task 10: Jobs Pages

**Files:** `src/pages/JobsPage.tsx`, `src/pages/JobDetailPage.tsx`

- [ ] **Step 1: JobsPage**

Requirements:
- Two-column layout: filter sidebar (240px) + job list
- Filter sidebar (sticky on desktop, collapsible on mobile):
  - Discipline checkboxes (8 options, multi-select via `disciplines[]` in URL)
  - Location text input (blur/Enter to apply, stored in URL param)
  - Remote Only checkbox
  - Salary Band checkboxes (single select)
  - Experience Level checkboxes (single select)
  - "Clear all filters" link (only shown when any filter is active)
- All filter state in URL params via `useSearchParams()` (deep-linkable, shareable)
- Job list: `useJobsInfinite(filters)` — infinite scroll with "Load More" button
- Mobile: filters collapsed behind "Filters ●" toggle button

- [ ] **Step 2: JobDetailPage**

Requirements:
- Two-column: main content + sidebar (300px, sticky)
- Header: company logo + title + meta row (company / location / level / salary)
- Tags row
- Posted date
- Markdown-like body (parse headers, paragraphs, lists)
- Full-width "Apply Now" button → `window.open(job.applyUrl)`
- Sidebar: Similar roles (same discipline, exclude current, limit 3) + studio card

- [ ] **Step 3: Commit**

```bash
git add src/pages/JobsPage.tsx src/pages/JobDetailPage.tsx
git commit -m "feat: Jobs pages — filterable list with URL state + full detail view"
```

---

## Task 11: Studios Pages

**Files:** `src/pages/StudiosPage.tsx`, `src/pages/StudioDetailPage.tsx`

- [ ] **Step 1: StudiosPage**

Requirements:
- Header + search input (client-side filter on studio name)
- Studio grid (3 columns desktop, 2 tablet, 1 mobile)
- Each card: logo + name + location + open roles + discipline tags
- Links to `/studios/:id`

- [ ] **Step 2: StudioDetailPage**

Requirements:
- Hero banner: logo initials (large) + name + location + founded + links (website/twitter/linkedin)
- Stats row: Open Roles count + disciplines count
- Two-column: open roles list (left) + disciplines sidebar (right)
- Open roles: `useStudioJobs(id)` → `<JobCard>` list
- Description block

- [ ] **Step 3: Commit**

```bash
git add src/pages/StudiosPage.tsx src/pages/StudioDetailPage.tsx
git commit -m "feat: Studios pages — grid with search + detail with jobs and info"
```

---

## Task 12: Content Pages

**Files:** `src/pages/ContentListPage.tsx`, `src/pages/TutorialsPage.tsx`, `src/pages/ArticlesPage.tsx`, `src/pages/DevLogsPage.tsx`, `src/pages/GuidesPage.tsx`, `src/pages/ContentDetailPage.tsx`

- [ ] **Step 1: ContentListPage (reusable)**

Requirements:
- Props: `type: ContentType`
- Page header with type name + total count
- Sort dropdown: Latest / Most Viewed / Top Rated
- Tag filter: horizontal scrolling pills extracted from returned items
- Content grid: `useContentInfinite({ type, sort, tags })` with "Load More"
- Featured item (from `useFeatured()`) shown at top if type matches

- [ ] **Step 2: Wrapper pages (4 files)**

Each is just:
```tsx
// TutorialsPage.tsx
import ContentListPage from './ContentListPage'
export default function TutorialsPage() { return <ContentListPage type="tutorial" /> }
```

- [ ] **Step 3: ContentDetailPage**

Requirements:
- Back link `← Back to {Type}s`
- Two-column: article body (left) + sidebar (right, sticky)
- Article body:
  - Hero: type badge + H1 + author avatar + date + read time + views
  - Thumbnail image or gradient fallback
  - Body rendered via a custom inline markdown parser:
    - Fenced code blocks (` ``` `) → `<pre><code>`
    - Inline backticks → `<code>`
    - `**bold**` → `<strong>`
    - `# ` / `## ` / `### ` headers
    - `- ` / `* ` lists → bullet paragraphs
    - `> ` blockquotes with orange left border
    - Numbered lists
  - "Read full article on Dev.to" CTA if `sourceUrl` present
  - Tags
- Sidebar: author card (name, role, bio, twitter/linkedin) + related content (same type, 3 items) + `<TrendingList />`

- [ ] **Step 4: Commit**

```bash
git add src/pages/ContentListPage.tsx src/pages/TutorialsPage.tsx src/pages/ArticlesPage.tsx src/pages/DevLogsPage.tsx src/pages/GuidesPage.tsx src/pages/ContentDetailPage.tsx
git commit -m "feat: content pages — reusable list with filters + full detail with markdown rendering"
```

---

## Task 13: ForStudiosPage (Coming Soon)

**File:** `src/pages/ForStudiosPage.tsx`

- [ ] **Step 1: Create the page**

Requirements:
- `document.title = 'For Studios — Loadout'` via `useEffect`
- Hero: 🏢 icon + "Coming Soon" badge + "TOOLS FOR STUDIOS" H1 + subtext
- Feature cards (3-column desktop, stacked mobile): Post a Job, Studio Profile, Pricing
- Email form: input + "Notify Me" button
  - Client-side validation: trim + regex before any network call
  - `Promise.race` with 10s timeout vs Supabase insert to `studio_waitlist`
  - States: idle → submitting → success | duplicate | error
  - ARIA: `role="alert"` on all feedback messages, `aria-invalid` / `aria-describedby` on input

- [ ] **Step 2: Run Supabase SQL (manual step)**

```sql
create table studio_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table studio_waitlist enable row level security;
create policy "allow_anon_insert" on studio_waitlist for insert to anon with check (true);
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForStudiosPage.tsx
git commit -m "feat: /for-studios coming soon page with email waitlist"
```

---

## Task 14: App.tsx Routing + main.tsx

**Files:** `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Wire all routes**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import StudiosPage from './pages/StudiosPage'
import StudioDetailPage from './pages/StudioDetailPage'
import TutorialsPage from './pages/TutorialsPage'
import ArticlesPage from './pages/ArticlesPage'
import DevLogsPage from './pages/DevLogsPage'
import GuidesPage from './pages/GuidesPage'
import ContentDetailPage from './pages/ContentDetailPage'
import ForStudiosPage from './pages/ForStudiosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/studios" element={<StudiosPage />} />
          <Route path="/studios/:id" element={<StudioDetailPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/tutorials/:id" element={<ContentDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ContentDetailPage />} />
          <Route path="/dev-logs" element={<DevLogsPage />} />
          <Route path="/dev-logs/:id" element={<ContentDetailPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:id" element={<ContentDetailPage />} />
          <Route path="/for-studios" element={<ForStudiosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Wrap with QueryClientProvider in main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: complete routing and QueryClient setup"
```

---

## Task 15: Cleanup

**Files:** `src/App.css`

- [ ] **Step 1: Delete Vite scaffold leftover**

```bash
rm src/App.css
```

- [ ] **Step 2: Remove unused dependency**

```bash
npm uninstall lucide-react
```

- [ ] **Step 3: Verify TypeScript clean**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Vite scaffold App.css and unused lucide-react dependency"
```

---

## Alignment Status

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Project Scaffold | ✅ Complete | Vite + React + TS + all deps installed |
| Task 2: Design System | ✅ Complete | All CSS vars, reset, fonts in index.css |
| Task 3: Type Definitions | ✅ Complete | src/lib/types.ts covers all entities |
| Task 4: Supabase Client + API | ✅ Complete | src/lib/supabase.ts + src/lib/api.ts |
| Task 5: Hooks | ✅ Complete | All 6 hook files present |
| Task 6: Layout Shell | ✅ Complete | Nav, Footer, Layout, PageTransition |
| Task 7: Shared UI Components | ✅ Complete | PageHeader, StatBlock, CalloutCard |
| Task 8: Domain Components | ✅ Complete | All 8 components present |
| Task 9: HomePage | ✅ Complete | Full hero + sidebar + tabs |
| Task 10: Jobs Pages | ✅ Complete | JobsPage + JobDetailPage |
| Task 11: Studios Pages | ✅ Complete | StudiosPage + StudioDetailPage |
| Task 12: Content Pages | ✅ Complete | ContentListPage + 4 wrappers + ContentDetailPage |
| Task 13: ForStudiosPage | ✅ Complete | With ARIA, timeout, all states |
| Task 14: Routing + main.tsx | ✅ Complete | All 15 routes wired |
| Task 15: Cleanup | ❌ **Needs work** | `src/App.css` not deleted; `lucide-react` unused dep still installed |
