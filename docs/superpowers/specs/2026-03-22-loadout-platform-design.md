# Loadout Platform — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## 1. Overview

**Loadout** is a professional platform for the gaming industry. It serves as a single destination for gaming professionals to find jobs, consume educational content (tutorials, articles, dev logs, guides), and stay connected to industry activity.

**Tagline:** "Level Up Your Career In Gaming"

**Target users:**
- Job seekers: game designers, engineers, artists, producers, audio designers, writers, marketers
- Studios & publishers posting roles
- Content creators sharing tutorials, dev logs, and industry articles

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Component library | shadcn/ui |
| Animation | Framer Motion |
| Data fetching | TanStack Query v5 |
| Icons | Lucide React |
| Deployment | Vercel |

**Data strategy:** API-first design. The frontend is built against a defined API contract from day one. During Phase 1 (frontend), a mock API layer serves that contract using local JSON data. In Phase 2 (backend), the real API replaces the mock with zero frontend refactoring required.

**Future backend stack (Phase 2):** To be decided — options include Node.js/Express, Next.js API routes, or a headless CMS. The API contract below is backend-agnostic.

---

## 3. Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#080810` | Page background |
| `--bg2` | `#0D0D18` | Secondary background (filter bar, footer) |
| `--surface` | `#111120` | Cards, panels |
| `--surface2` | `#181828` | Hover states |
| `--border` | `#1E1E35` | Default borders |
| `--border2` | `#28283F` | Elevated borders |
| `--text` | `#F0F0FF` | Primary text |
| `--sub` | `#8888AA` | Secondary text |
| `--muted` | `#55556A` | Disabled / metadata |
| `--orange` | `#FF5C00` | Primary accent — CTA, active states, highlights |
| `--cyan` | `#00D4FF` | Tutorial content type |
| `--purple` | `#9D60FF` | Dev Log content type |
| `--green` | `#39FF83` | New badge, Article content type |
| `--red` | `#FF3A3A` | Hot badge |
| `--amber` | `#FFB830` | Guide content type |

### Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / headings | Barlow Condensed | 700–900 | Hero titles, section headers, logo |
| UI labels | Rajdhani | 600–700 | Nav tabs, badges, section titles, filter pills |
| Body | Inter | 400–600 | Article text, descriptions, metadata |

### Design Language
- **Angular clip-paths** on cards and buttons: `clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)` — gaming HUD aesthetic
- **Orange left-stripe** on interactive job cards (hover state)
- **Orange glow** on primary buttons: `box-shadow: 0 0 20px rgba(255,92,0,0.35)`
- **Dot-grid or line-grid** background texture in hero
- **Radial gradient glow** in hero (orange, bottom-left origin)
- **3px left border** on nav — orange gradient fading to transparent
- **Blinking dot** on live/active indicators
- **Color-coded content type badges**: cyan = Tutorial, amber (`#FFB830`) = Guide, purple = Dev Log, green = Article
- **Font loading**: Google Fonts via `<link>` in `index.html` — Barlow Condensed (700, 800, 900), Rajdhani (600, 700), Inter (400, 500, 600, 700)

---

## 4. Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, featured jobs, content preview, sidebar |
| `/jobs` | Jobs | Full job listings with discipline filters, search |
| `/jobs/:id` | Job Detail | Full job description, apply CTA, related jobs |
| `/studios` | Studios | Studio directory with open role counts |
| `/studios/:id` | Studio Detail | Studio profile, all their job listings |
| `/tutorials` | Tutorials | Tutorial articles grid with difficulty/tool filters |
| `/tutorials/:id` | Tutorial Detail | Full tutorial article page |
| `/articles` | Articles | Industry articles grid |
| `/articles/:id` | Article Detail | Full article page |
| `/dev-logs` | Dev Logs | Developer log posts grid |
| `/dev-logs/:id` | Dev Log Detail | Full dev log page |
| `/guides` | Guides | Career and technical guides |
| `/guides/:id` | Guide Detail | Full guide page |

All four content detail routes (`/tutorials/:id`, `/articles/:id`, `/dev-logs/:id`, `/guides/:id`) share one `ContentDetailPage` layout component. The `type` field on the `ContentItem` model determines which color scheme and label is applied.

---

## 5. Page Layouts

### Home Page

```
[Sticky Nav — Logo | Tabs | Post a Job | Find Work CTA]
[Live ticker — orange "Live" badge + scrolling activity]
[Hero — 2-col: left (headline + CTA) | right (featured cards + stats)]
[Filter bar — Discipline pills: All / Game Design / Engineering / Art / etc.]
[Main grid — 2-col: left (jobs list + content grid) | right sidebar]
  Left:
    - Featured Jobs (5–6 cards)
    - Content tabs: Tutorials / Articles / Dev Logs / Guides
    - Content grid: 1 featured card (full-width) + 2-col smaller cards
  Right sidebar:
    - Live Activity feed
    - Hiring Now (studio list with role counts)
    - Trending (numbered list 01–04)
    - Post a Job callout card
[Footer — 4-col: brand | Find Work | Learn | For Studios]
```

### Jobs Page

```
[Sticky Nav]
[Page header — title + total count]
[Two-col layout: filters sidebar left | job cards right]
  Filters:
    - Discipline: multi-select checkboxes (additive AND)
    - Location: text input (filters by string match)
    - Remote: toggle boolean
    - Salary range: dropdown of bands (e.g. <$60k / $60–100k / $100–150k / $150k+)
    - Experience level: checkboxes (Junior / Mid / Senior / Lead)
  Filter behaviour: all active filters are AND-combined; results update live on change
  URL state: active filters are reflected in query params (e.g. ?discipline=Engineering&remote=true)
    so filtered views are shareable/bookmarkable
  Job cards: same JobCard component as homepage
[Load More button — loads next 10 results from mock data]
```

### Content Pages (Tutorials / Articles / Dev Logs / Guides)

```
[Sticky Nav]
[Section header with description]
[Filter row: tag pills (multi-select, additive), sort dropdown (Latest / Most Viewed / Top Rated)]
[Featured article — large ContentCard (full-width)]
[Article grid — 3-col ContentCards]
[Load More button — loads next 9 results from mock data]
```

### Studio Detail Page

```
[Sticky Nav]
[Studio header — logo, name, location, description, social links]
[Stats row — total roles, founded, team size (if available)]
[Two-col: job listings (same JobCard design) | studio info sidebar]
  Job listings: filtered to this studio's studioId, with Load More
  Sidebar: about panel, website link, disciplines they hire for
```

### Content Detail Page

```
[Sticky Nav]
[Article hero — type badge (color-coded), title, author name + avatar, date, read time]
[Two-col: article body (markdown rendered) | sidebar]
  Sidebar:
    - Author card: avatar, name, role/bio, social links
    - Related content: 3 ContentCards of the same type
    - Trending: same TrendingList component
```

---

## 6. Key Components

| Component | Description |
|---|---|
| `JobCard` | Job listing card with logo, title, company, location, badges, salary |
| `ContentCard` | Article/tutorial/devlog card with thumbnail, type badge, title, meta |
| `StudioRow` | Studio row with logo, name, open role count, arrow |
| `DisciplineFilter` | Horizontal scrollable pill filter bar |
| `LiveTicker` | Auto-scrolling marquee with live activity items |
| `TrendingList` | Numbered list of trending content (01–04) |
| `StatBlock` | Stat value + label block (used in hero) |
| `ActivityFeed` | Sidebar live activity items with colored dots |
| `ContentTypeBadge` | Color-coded badge: Tutorial/Guide/Dev Log/Article |
| `CalloutCard` | Employer CTA card with orange border and glow |
| `PageHeader` | Section title with accent left-stripe |

---

## 7. Navigation

**Top nav tabs:** Home · Jobs · Studios · Tutorials · Articles · Dev Logs · Guides

- Active tab: white text + 2px orange underline with glow
- Hover: text brightens
- Right side: "Post a Job" (ghost outline) + "Find Work ▶" (orange, angular clip-path, glow)
- Sticky with `backdrop-filter: blur(20px)` and slight bg opacity
- 3px orange-to-transparent left border stripe

---

## 8. Data Model (Mock)

### Author
```ts
{
  id: string
  name: string
  avatar?: string  // URL or initials fallback
  role: string     // e.g. "Senior Game Designer at Riot Games"
  bio: string
  twitter?: string
  linkedin?: string
}
```

### ContentItem
```ts
{
  id: string
  type: 'tutorial' | 'article' | 'devlog' | 'guide'
  title: string
  authorId: string  // foreign key → Author; resolved by joining against the authors mock array
  readTime: number  // minutes
  thumbnail?: string
  publishedAt: Date
  views: number
  rating: number    // 0.0–5.0, used for "Top Rated" sort
  tags: string[]
  body: string      // markdown
}
```

**Mock data structure:** Two separate arrays in mock files — `jobs[]`, `contentItems[]`, `authors[]`, `studios[]`. Joins are done in the component or query hook (e.g. `authors.find(a => a.id === item.authorId)`).

### Job
```ts
{
  id: string
  studioId: string  // foreign key → Studio
  title: string
  company: string
  companyLogo: string // initials fallback
  companyColor: string
  location: string
  remote: boolean
  discipline: 'Game Design' | 'Engineering' | 'Art & VFX' | 'Marketing' | 'Audio' | 'Writing' | 'Production' | 'Analytics'
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead'
  salaryBand?: '<$60k' | '$60-100k' | '$100-150k' | '$150k+'
  salary?: string   // display string e.g. "$120–$160k"
  tags: ('new' | 'hot' | 'featured' | 'remote')[]
  postedAt: Date
  description: string
  applyUrl: string
}
```

### Studio
```ts
{
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
  disciplines: string[]  // disciplines this studio hires for
  // openRoles is derived at runtime by counting jobs where job.studioId === studio.id
}
```

---

## 9. API Contract & Data Layer Architecture

### Architecture Pattern

```
UI Components
    ↓
Custom hooks  (e.g. useJobs, useContentItem, useStudio)
    ↓
TanStack Query  (caching, loading/error states, refetch)
    ↓
API client  (src/lib/api.ts — one function per endpoint)
    ↓
Phase 1: Mock adapter  →  src/mocks/  (JSON files, simulated delay)
Phase 2: Real backend  →  REST API or GraphQL
```

The `src/lib/api.ts` file is the **only** place that changes when switching from mock to real. All hooks, components, and query keys stay identical.

### Environment Config

```
VITE_API_BASE_URL=http://localhost:4000/api   # Phase 2 backend
VITE_USE_MOCK=true                             # Phase 1: use mock adapter
```

When `VITE_USE_MOCK=true`, `api.ts` imports from the mock adapter. When `false`, it uses `fetch` against `VITE_API_BASE_URL`.

### API Endpoints (Contract)

All responses follow the shape the frontend expects. Mock data must match these shapes exactly.

#### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobs` | List jobs with filters |
| GET | `/jobs/:id` | Single job detail |

**GET /jobs query params:**
```
?discipline=Engineering
&remote=true
&salaryBand=$100-150k
&experienceLevel=Senior
&studioId=riot-games
&page=1
&limit=10
```

**Response shape:**
```ts
// GET /jobs
{
  data: Job[]
  total: number
  page: number
  limit: number
}

// GET /jobs/:id
{
  data: Job
}
```

#### Studios

| Method | Endpoint | Description |
|---|---|---|
| GET | `/studios` | List all studios |
| GET | `/studios/:id` | Studio detail |
| GET | `/studios/:id/jobs` | Jobs for a specific studio |

**Response shape:**
```ts
// GET /studios
{ data: Studio[] }

// GET /studios/:id
{ data: Studio }

// GET /studios/:id/jobs
{ data: Job[], total: number }
```

#### Content

| Method | Endpoint | Description |
|---|---|---|
| GET | `/content` | List content items with filters |
| GET | `/content/:id` | Single content item detail |
| GET | `/content/trending` | Top 4 trending items |
| GET | `/content/featured` | Featured item for homepage |

**GET /content query params:**
```
?type=tutorial         # tutorial | article | devlog | guide
&tags=unreal-engine,vfx
&sort=latest           # latest | most-viewed | top-rated
&page=1
&limit=9
```

**Response shape:**
```ts
// GET /content
{
  data: ContentItem[]
  total: number
  page: number
  limit: number
}

// GET /content/:id  (includes resolved author)
{
  data: ContentItem & { author: Author }
}
```

#### Authors

| Method | Endpoint | Description |
|---|---|---|
| GET | `/authors/:id` | Single author profile |

#### Activity Feed

| Method | Endpoint | Description |
|---|---|---|
| GET | `/activity` | Latest live activity items (limit 10) |

**Response shape:**
```ts
{
  data: {
    id: string
    type: 'job_posted' | 'studio_joined' | 'content_published'
    message: string        // pre-formatted display string
    highlight: string      // the bold part (company/title)
    color: 'orange' | 'cyan' | 'green'
    createdAt: Date
  }[]
}
```

#### Platform Stats

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Aggregated platform stats for hero |

**Response shape:**
```ts
{
  data: {
    openRoles: number
    studios: number
    members: number
    articles: number
  }
}
```

### TanStack Query Hooks (to be built)

| Hook | Endpoint | Used on |
|---|---|---|
| `useJobs(filters)` | GET /jobs | Home, Jobs page |
| `useJob(id)` | GET /jobs/:id | Job Detail |
| `useStudios()` | GET /studios | Studios page, sidebar |
| `useStudio(id)` | GET /studios/:id | Studio Detail |
| `useStudioJobs(id)` | GET /studios/:id/jobs | Studio Detail |
| `useContent(type, filters)` | GET /content | Content pages, Home tabs |
| `useContentItem(id)` | GET /content/:id | Content Detail |
| `useTrending()` | GET /content/trending | Sidebar |
| `useFeatured()` | GET /content/featured | Home hero area |
| `useActivity()` | GET /activity | Live Activity feed |
| `useStats()` | GET /stats | Hero stat blocks |

---

## 10. Responsiveness

- **Desktop** (≥1280px): Full two-column layout as designed
- **Tablet** (768px–1279px): Single column, sidebar moves below main content
- **Mobile** (<768px): Stacked, filter bar scrolls horizontally, nav collapses to hamburger

---

## 11. Animations (Framer Motion)

| Element | Animation |
|---|---|
| Job cards | Fade-in stagger on page load |
| Content cards | Fade up on scroll into view |
| Page transitions | Fade + slight slide between routes |
| Live ticker | CSS `animation: ticker` marquee (no Framer needed) |
| Blinking dots | CSS keyframe animation |
| Button hover | `translateY(-1px)` + glow intensity increase |
| Hero elements | Stagger fade-in on mount |

---

## 12. Assumptions & Out of Scope (MVP)

**Phase 1 — Frontend (current scope):**
- All data served from a mock adapter (`src/mocks/`) against the defined API contract
- TanStack Query wraps every data call from day one — no raw fetch in components
- No backend, no auth, no database
- No job application flow (CTA button links to external URL placeholder)
- No comment system
- Search bar renders as a placeholder input — no functionality
- Email newsletter input renders as placeholder — no functionality

**Phase 2 — Backend (future scope):**
- Build a REST API implementing the contract defined in Section 9
- Replace `VITE_USE_MOCK=true` with `VITE_USE_MOCK=false` + set `VITE_API_BASE_URL`
- Zero frontend refactoring required — only `src/lib/api.ts` changes
- Add authentication / user profiles
- Add job application submission
- Add content creation / CMS for articles, tutorials, dev logs
- Add studio admin portal
- Add real search functionality
- Add email newsletter integration
