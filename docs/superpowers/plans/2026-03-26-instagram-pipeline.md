# Instagram Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI script that queries Supabase, generates 6 styled Instagram post cards as 1080×1080 PNGs with captions, and outputs a weekly content folder ready for manual scheduling.

**Architecture:** Single entry-point script (`scripts/instagram.ts`) orchestrates five focused modules: fetch (Supabase queries), select (content picking + dedup), cards (HTML templates), captions (text generation), and export (Puppeteer screenshot). Output lands in `instagram/week-YYYY-WNN/`.

**Tech Stack:** TypeScript, tsx (already used in project), Supabase JS client, Puppeteer, dotenv, Node fs

---

## File Map

| File | Responsibility |
|------|---------------|
| `scripts/instagram.ts` | Entry point — orchestrates all modules, writes output folder |
| `scripts/instagram/types.ts` | Pipeline-internal types (PostData, PostType, WeeklyBatch) |
| `scripts/instagram/fetch.ts` | All Supabase queries (jobs, studios, content, stats) |
| `scripts/instagram/select.ts` | Pick best candidate per post type + dedup via `.used.json` |
| `scripts/instagram/cards.ts` | HTML card template for each of the 6 post types |
| `scripts/instagram/captions.ts` | Caption + hashtag string builder per post type |
| `scripts/instagram/export.ts` | Puppeteer: render HTML → 1080×1080 PNG |
| `scripts/instagram/calendar.ts` | Generate `calendar.md` from a WeeklyBatch |
| `instagram/.used.json` | Auto-created at runtime; tracks used content IDs per type |

---

## Task 1: Install puppeteer and add npm script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install puppeteer**

```bash
cd d:/GamingWebsite/Loadout
npm install puppeteer
```

Expected: `node_modules/puppeteer` present, `package.json` updated.

- [ ] **Step 2: Add instagram script to package.json**

In `package.json`, add to `"scripts"`:
```json
"instagram": "tsx scripts/instagram.ts"
```

- [ ] **Step 3: Verify**

```bash
npm run instagram 2>&1 | head -5
```

Expected: Error about missing file `scripts/instagram.ts` — that's fine, confirms the script entry is wired up.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add puppeteer and instagram npm script"
```

---

## Task 2: Pipeline types

**Files:**
- Create: `scripts/instagram/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// scripts/instagram/types.ts

export type PostType =
  | 'job-spotlight'
  | 'tutorial'
  | 'studio-feature'
  | 'industry-stat'
  | 'dev-log'
  | 'weekly-roundup'

export interface JobPost {
  type: 'job-spotlight'
  title: string
  company: string
  location: string
  remote: boolean
  salaryBand?: string
  salary?: string
  discipline: string
  postedAt: string
  applyUrl: string
  id: string
}

export interface TutorialPost {
  type: 'tutorial'
  title: string
  slug: string
  tags: string[]
  id: string
}

export interface StudioPost {
  type: 'studio-feature'
  name: string
  slug: string
  location: string
  openRoles: number
  description: string
  id: string
}

export interface StatPost {
  type: 'industry-stat'
  stat: string
  context: string
}

export interface DevLogPost {
  type: 'dev-log'
  title: string
  slug: string
  authorName: string
  tags: string[]
  id: string
}

export interface RoundupPost {
  type: 'weekly-roundup'
  jobCount: number
  highlights: string[]   // 2-4 short lines
  studioHighlight?: string
}

export type PostData =
  | JobPost
  | TutorialPost
  | StudioPost
  | StatPost
  | DevLogPost
  | RoundupPost

export interface WeekPost {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sun'
  filename: string   // e.g. "mon-job-spotlight"
  data: PostData
}

export interface WeeklyBatch {
  weekLabel: string   // e.g. "2026-W14"
  posts: WeekPost[]
}

export interface UsedIds {
  'job-spotlight': string[]
  tutorial: string[]
  'studio-feature': string[]
  'dev-log': string[]
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/instagram/types.ts
git commit -m "feat: add instagram pipeline types"
```

---

## Task 3: Supabase fetch module

**Files:**
- Create: `scripts/instagram/fetch.ts`
- Test: `scripts/instagram/fetch.test.ts`

The script uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars — same pattern as `scripts/sync.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/instagram/fetch.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({
            data: table === 'jobs'
              ? [{ id: 'j1', title: 'Animator', company: 'EA', location: 'London',
                   remote: false, discipline: 'Art & VFX', posted_at: '2026-03-20',
                   apply_url: 'https://ea.com/jobs/1', salary_band: '$60-100k' }]
              : [],
            error: null,
          })
        })
      })
    })
  })
}))

import { fetchJobs, fetchContent, fetchStudios } from './fetch'

describe('fetchJobs', () => {
  it('returns job records from supabase', async () => {
    const jobs = await fetchJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe('j1')
    expect(jobs[0].title).toBe('Animator')
  })
})

describe('fetchContent', () => {
  it('returns empty array when no data', async () => {
    const tutorials = await fetchContent('tutorial')
    expect(Array.isArray(tutorials)).toBe(true)
  })
})

describe('fetchStudios', () => {
  it('returns empty array when no data', async () => {
    const studios = await fetchStudios()
    expect(Array.isArray(studios)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run scripts/instagram/fetch.test.ts
```

Expected: FAIL — `fetch.ts` not found.

- [ ] **Step 3: Implement fetch.ts**

```typescript
// scripts/instagram/fetch.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Job, Studio, ContentItem } from '../../src/lib/types'

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

export async function fetchJobs(limit = 20): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchJobs: ${error.message}`)
  return data ?? []
}

export async function fetchContent(type: 'tutorial' | 'devlog', limit = 20): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', type)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchContent(${type}): ${error.message}`)
  return data ?? []
}

export async function fetchStudios(limit = 20): Promise<Studio[]> {
  const { data, error } = await supabase
    .from('studios')
    .select('*')
    .limit(limit)
  if (error) throw new Error(`fetchStudios: ${error.message}`)
  return data ?? []
}

export async function fetchJobCountThisWeek(): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('posted_at', since.toISOString())
  if (error) return 0
  return count ?? 0
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run scripts/instagram/fetch.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram/fetch.ts scripts/instagram/fetch.test.ts
git commit -m "feat: instagram fetch module with supabase queries"
```

---

## Task 4: Content selection + dedup

**Files:**
- Create: `scripts/instagram/select.ts`
- Test: `scripts/instagram/select.test.ts`
- Runtime: `instagram/.used.json` (auto-created)

- [ ] **Step 1: Write the failing tests**

```typescript
// scripts/instagram/select.test.ts
import { describe, it, expect } from 'vitest'
import { pickUnused, markUsed, loadUsed, freshUsed } from './select'
import type { UsedIds } from './types'

const baseUsed: UsedIds = {
  'job-spotlight': [],
  tutorial: [],
  'studio-feature': [],
  'dev-log': [],
}

describe('pickUnused', () => {
  it('picks the first item when none used', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = pickUnused(items, 'job-spotlight', baseUsed)
    expect(result?.id).toBe('a')
  })

  it('skips already-used IDs', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const used: UsedIds = { ...baseUsed, 'job-spotlight': ['a'] }
    const result = pickUnused(items, 'job-spotlight', used)
    expect(result?.id).toBe('b')
  })

  it('cycles back to oldest when all used', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const used: UsedIds = { ...baseUsed, 'job-spotlight': ['a', 'b'] }
    const result = pickUnused(items, 'job-spotlight', used)
    expect(result?.id).toBe('a')
  })

  it('returns null when items array is empty', () => {
    const result = pickUnused([], 'job-spotlight', baseUsed)
    expect(result).toBeNull()
  })
})

describe('markUsed', () => {
  it('adds id to the correct type bucket', () => {
    const used = markUsed(baseUsed, 'tutorial', 'tut-1')
    expect(used.tutorial).toContain('tut-1')
    expect(used['job-spotlight']).toHaveLength(0)
  })

  it('does not duplicate existing id', () => {
    const used: UsedIds = { ...baseUsed, tutorial: ['tut-1'] }
    const result = markUsed(used, 'tutorial', 'tut-1')
    expect(result.tutorial).toHaveLength(1)
  })
})

describe('freshUsed', () => {
  it('returns empty buckets', () => {
    const u = freshUsed()
    expect(u['job-spotlight']).toEqual([])
    expect(u.tutorial).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run scripts/instagram/select.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement select.ts**

```typescript
// scripts/instagram/select.ts
import fs from 'fs'
import path from 'path'
import type { UsedIds, PostType } from './types'

const USED_FILE = path.resolve('instagram/.used.json')

type HasId = { id: string }

export function freshUsed(): UsedIds {
  return { 'job-spotlight': [], tutorial: [], 'studio-feature': [], 'dev-log': [] }
}

export function loadUsed(): UsedIds {
  if (!fs.existsSync(USED_FILE)) return freshUsed()
  try {
    return JSON.parse(fs.readFileSync(USED_FILE, 'utf-8')) as UsedIds
  } catch {
    return freshUsed()
  }
}

export function saveUsed(used: UsedIds): void {
  fs.mkdirSync(path.dirname(USED_FILE), { recursive: true })
  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2))
}

export function markUsed(used: UsedIds, type: keyof UsedIds, id: string): UsedIds {
  const bucket = used[type]
  if (bucket.includes(id)) return used
  return { ...used, [type]: [...bucket, id] }
}

export function pickUnused<T extends HasId>(
  items: T[],
  type: keyof UsedIds,
  used: UsedIds
): T | null {
  if (items.length === 0) return null
  const usedIds = used[type]
  const fresh = items.find(i => !usedIds.includes(i.id))
  if (fresh) return fresh
  // All used — cycle: return oldest (first item, which is least-recently used)
  return items[0]
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run scripts/instagram/select.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram/select.ts scripts/instagram/select.test.ts
git commit -m "feat: instagram content selection with dedup"
```

---

## Task 5: Caption generator

**Files:**
- Create: `scripts/instagram/captions.ts`
- Test: `scripts/instagram/captions.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// scripts/instagram/captions.test.ts
import { describe, it, expect } from 'vitest'
import { buildCaption } from './captions'
import type { JobPost, TutorialPost, StatPost } from './types'

describe('buildCaption – job-spotlight', () => {
  const post: JobPost = {
    type: 'job-spotlight',
    id: 'j1',
    title: 'Senior Concept Artist',
    company: 'Riot Games',
    location: 'Los Angeles',
    remote: true,
    salaryBand: '$100-150k',
    discipline: 'Art & VFX',
    postedAt: '2026-03-24',
    applyUrl: 'https://riotgames.com/jobs/1',
  }

  it('includes role and studio', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('Senior Concept Artist')
    expect(caption).toContain('Riot Games')
  })

  it('includes remote label', () => {
    expect(buildCaption(post)).toContain('Remote')
  })

  it('includes builtloadout.com/jobs link', () => {
    expect(buildCaption(post)).toContain('builtloadout.com/jobs')
  })

  it('includes discipline hashtag', () => {
    expect(buildCaption(post)).toContain('#artvfx')
  })
})

describe('buildCaption – tutorial', () => {
  const post: TutorialPost = {
    type: 'tutorial',
    id: 't1',
    title: 'Optimize Draw Calls in Unity',
    slug: 'optimize-draw-calls-unity',
    tags: ['unity', 'performance'],
  }

  it('includes title and link', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('Optimize Draw Calls in Unity')
    expect(caption).toContain('builtloadout.com/tutorials/optimize-draw-calls-unity')
  })

  it('includes tag hashtags', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('#unity')
  })
})

describe('buildCaption – industry-stat', () => {
  const post: StatPost = {
    type: 'industry-stat',
    stat: '73% of game devs are self-taught',
    context: 'in at least one discipline',
  }

  it('includes stat text', () => {
    expect(buildCaption(post)).toContain('73% of game devs are self-taught')
  })

  it('includes builtloadout.com link', () => {
    expect(buildCaption(post)).toContain('builtloadout.com')
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run scripts/instagram/captions.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement captions.ts**

```typescript
// scripts/instagram/captions.ts
import type { PostData, JobPost, TutorialPost, StudioPost, StatPost, DevLogPost, RoundupPost } from './types'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function jobCaption(p: JobPost): string {
  const loc = p.remote ? 'Remote' : p.location
  const salary = p.salaryBand ?? p.salary ?? ''
  const salaryLine = salary ? `  💰 ${salary}` : ''
  const disciplineTag = `#${slug(p.discipline)}`
  const studioTag = `#${slug(p.company)}`
  return `🎮 ${p.title} @ ${p.company}

Join one of gaming's most sought-after teams.

📍 ${loc}${salaryLine}  🗓 Posted ${p.postedAt}

Apply + browse more roles → builtloadout.com/jobs

#gamedev #gamedevelopment #gamejobs ${disciplineTag} ${studioTag}`
}

function tutorialCaption(p: TutorialPost): string {
  const tags = p.tags.map(t => `#${slug(t)}`).join(' ')
  return `🛠 ${p.title}

Level up your skills with this step-by-step guide.

Full tutorial → builtloadout.com/tutorials/${p.slug}

#gamedev #gamedevelopment ${tags} #gamedevtips #indiedev`
}

function studioCaption(p: StudioPost): string {
  const studioTag = `#${slug(p.name)}`
  return `🏢 ${p.name}

${p.description.slice(0, 100).trimEnd()}…

${p.openRoles} open role${p.openRoles !== 1 ? 's' : ''} right now.

Browse → builtloadout.com/studios/${p.slug}

#gamedev #gamejobs ${studioTag} #gamedevelopment`
}

function statCaption(p: StatPost): string {
  return `📊 Did you know?

${p.stat}

${p.context}

More game dev insights → builtloadout.com

#gamedev #gamedevelopment #gameindustry #gamedevfacts`
}

function devlogCaption(p: DevLogPost): string {
  const tags = p.tags.slice(0, 2).map(t => `#${slug(t)}`).join(' ')
  return `📓 Dev Log: ${p.title}

Follow the build — raw progress, lessons learned, mistakes made.

by ${p.authorName} → builtloadout.com/dev-logs/${p.slug}

#devlog #indiedev #gamedev #gamedevelopment ${tags}`
}

function roundupCaption(p: RoundupPost): string {
  const bullets = p.highlights.map(h => `▸ ${h}`).join('\n')
  const studio = p.studioHighlight ? `▸ ${p.studioHighlight}\n` : ''
  return `📋 This week on Loadout

▸ ${p.jobCount} new role${p.jobCount !== 1 ? 's' : ''} posted
${bullets}
${studio}
Stay current → builtloadout.com

#gamedev #gamedevelopment #gamejobs #weeklyroundup #indiedev`
}

export function buildCaption(post: PostData): string {
  switch (post.type) {
    case 'job-spotlight':    return jobCaption(post)
    case 'tutorial':         return tutorialCaption(post)
    case 'studio-feature':   return studioCaption(post)
    case 'industry-stat':    return statCaption(post)
    case 'dev-log':          return devlogCaption(post)
    case 'weekly-roundup':   return roundupCaption(post)
  }
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run scripts/instagram/captions.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram/captions.ts scripts/instagram/captions.test.ts
git commit -m "feat: instagram caption builder for all 6 post types"
```

---

## Task 6: HTML card templates

**Files:**
- Create: `scripts/instagram/cards.ts`
- Test: `scripts/instagram/cards.test.ts`

Cards use the Style A visual identity (dark + orange). Google Fonts loaded via CDN. Each function returns a complete HTML document string ready for Puppeteer.

- [ ] **Step 1: Write the failing tests**

```typescript
// scripts/instagram/cards.test.ts
import { describe, it, expect } from 'vitest'
import { buildCard } from './cards'
import type { JobPost, StatPost } from './types'

describe('buildCard', () => {
  it('returns a full HTML document', () => {
    const post: JobPost = {
      type: 'job-spotlight', id: 'j1',
      title: 'Senior Animator', company: 'CD Projekt Red',
      location: 'Warsaw', remote: false, discipline: 'Art & VFX',
      postedAt: '2026-03-24', applyUrl: 'https://cdprojektred.com/jobs/1',
    }
    const html = buildCard(post)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Senior Animator')
    expect(html).toContain('CD Projekt Red')
    expect(html).toContain('LOADOUT')
    expect(html).toContain('builtloadout.com')
  })

  it('includes the correct tag color for tutorial (cyan)', () => {
    const html = buildCard({ type: 'tutorial', id: 't1', title: 'Test', slug: 'test', tags: [] })
    expect(html).toContain('#00D4FF')
  })

  it('shows stat number prominently for industry-stat', () => {
    const post: StatPost = {
      type: 'industry-stat',
      stat: '73% of game devs are self-taught',
      context: 'in at least one discipline',
    }
    const html = buildCard(post)
    expect(html).toContain('73%')
  })

  it('includes corner glow element', () => {
    const post: JobPost = {
      type: 'job-spotlight', id: 'j1',
      title: 'Test', company: 'Test Co',
      location: 'Remote', remote: true, discipline: 'Engineering',
      postedAt: '2026-03-24', applyUrl: 'https://test.com',
    }
    expect(buildCard(post)).toContain('corner-glow')
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run scripts/instagram/cards.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement cards.ts**

```typescript
// scripts/instagram/cards.ts
import type { PostData, JobPost, TutorialPost, StudioPost, StatPost, DevLogPost, RoundupPost } from './types'

const TAG_COLORS: Record<string, string> = {
  'job-spotlight':  '#FF5C00',
  'tutorial':       '#00D4FF',
  'studio-feature': '#9D60FF',
  'industry-stat':  '#39FF83',
  'dev-log':        '#FFB830',
  'weekly-roundup': '#FF5C00',
}

const TAG_LABELS: Record<string, string> = {
  'job-spotlight':  'Job Spotlight',
  'tutorial':       'Tutorial',
  'studio-feature': 'Studio Feature',
  'industry-stat':  'Industry Stat',
  'dev-log':        'Dev Log',
  'weekly-roundup': 'Weekly Roundup',
}

function base(type: string, bodyContent: string): string {
  const color = TAG_COLORS[type]
  const label = TAG_LABELS[type]
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1080px; overflow: hidden; }
  body {
    background: #080810;
    color: #F0F0FF;
    font-family: 'Inter', sans-serif;
    width: 1080px; height: 1080px;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 72px;
    position: relative;
  }
  .corner-glow {
    position: absolute; top: -80px; right: -80px;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(255,92,0,0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .tag {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: ${color};
    background: ${color}18;
    border: 2px solid ${color}55;
    display: inline-block;
    padding: 8px 20px; border-radius: 6px;
  }
  .title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 96px; font-weight: 800;
    color: #F0F0FF; line-height: 1.0;
    text-transform: uppercase;
  }
  .accent-bar { width: 72px; height: 6px; background: ${color}; margin: 28px 0; }
  .meta { font-size: 28px; color: #8888AA; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; }
  .logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 32px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #FF5C00;
  }
  .url { font-family: 'Rajdhani', sans-serif; font-size: 28px; color: #55556A; font-weight: 600; }
  .border-card { border: 1px solid #1E1E35; }
</style>
</head>
<body class="border-card">
  <div class="corner-glow"></div>
  <div><span class="tag">${label}</span></div>
  <div>${bodyContent}</div>
  <div class="bottom">
    <div class="logo">LOADOUT</div>
    <div class="url">builtloadout.com</div>
  </div>
</body>
</html>`
}

function titleBlock(title: string, meta: string, color: string): string {
  return `<div class="title">${title.toUpperCase()}</div>
  <div class="accent-bar" style="background:${color}"></div>
  <div class="meta">${meta}</div>`
}

function jobCard(p: JobPost): string {
  const loc = p.remote ? 'Remote' : p.location
  const salary = p.salaryBand ? ` · ${p.salaryBand}` : ''
  const meta = `${p.company} · ${loc}${salary}`
  // Break long titles at word boundaries for 3-line display
  const title = p.title.replace(/ /g, '<br>')
  return base('job-spotlight', titleBlock(title, meta, TAG_COLORS['job-spotlight']))
}

function tutorialCard(p: TutorialPost): string {
  const title = p.title.replace(/ /g, '<br>')
  return base('tutorial', titleBlock(title, 'builtloadout.com/tutorials', TAG_COLORS['tutorial']))
}

function studioCard(p: StudioPost): string {
  const meta = `${p.openRoles} open roles · ${p.location}`
  return base('studio-feature', titleBlock(p.name, meta, TAG_COLORS['studio-feature']))
}

function statCard(p: StatPost): string {
  const color = TAG_COLORS['industry-stat']
  // Extract the leading number/percentage for big display
  const match = p.stat.match(/^([\d]+%?(?:\+|x)?)/)
  const bigNum = match ? match[1] : ''
  const rest = bigNum ? p.stat.slice(bigNum.length).trim() : p.stat

  const body = bigNum
    ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:200px;font-weight:800;color:${color};line-height:1">${bigNum}</div>
       <div style="font-family:'Barlow Condensed',sans-serif;font-size:56px;font-weight:700;color:#F0F0FF;text-transform:uppercase;line-height:1.1;margin-top:12px">${rest.toUpperCase()}</div>
       <div class="accent-bar" style="background:${color};margin-top:24px"></div>`
    : `<div class="title" style="font-size:64px">${p.stat.toUpperCase()}</div>
       <div class="accent-bar" style="background:${color}"></div>`

  return base('industry-stat', body)
}

function devlogCard(p: DevLogPost): string {
  const color = TAG_COLORS['dev-log']
  const title = p.title.replace(/ /g, '<br>')
  const meta = `by ${p.authorName}`
  return base('dev-log', titleBlock(title, meta, color))
}

function roundupCard(p: RoundupPost): string {
  const color = TAG_COLORS['weekly-roundup']
  const items = [`${p.jobCount} new role${p.jobCount !== 1 ? 's' : ''} posted`, ...p.highlights]
  const bullets = items.slice(0, 4).map(h =>
    `<div style="display:flex;gap:20px;align-items:flex-start;padding:16px 0;border-bottom:1px solid #1E1E35">
      <span style="color:${color};font-size:28px;flex-shrink:0">▸</span>
      <span style="font-family:'Inter',sans-serif;font-size:30px;color:#8888AA">${h}</span>
    </div>`
  ).join('')

  const body = `
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:64px;font-weight:800;text-transform:uppercase;margin-bottom:24px">
      THIS WEEK<br>IN GAME DEV
    </div>
    ${bullets}
  `
  return base('weekly-roundup', body)
}

export function buildCard(post: PostData): string {
  switch (post.type) {
    case 'job-spotlight':    return jobCard(post)
    case 'tutorial':         return tutorialCard(post)
    case 'studio-feature':   return studioCard(post)
    case 'industry-stat':    return statCard(post)
    case 'dev-log':          return devlogCard(post)
    case 'weekly-roundup':   return roundupCard(post)
  }
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run scripts/instagram/cards.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram/cards.ts scripts/instagram/cards.test.ts
git commit -m "feat: instagram HTML card templates for all 6 post types"
```

---

## Task 7: Puppeteer export

**Files:**
- Create: `scripts/instagram/export.ts`

Note: No unit test for this module — it wraps Puppeteer which requires a real browser. Verified via end-to-end run in Task 9.

- [ ] **Step 1: Implement export.ts**

```typescript
// scripts/instagram/export.ts
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

/**
 * Renders an HTML string to a 1080×1080 PNG file.
 * @param html  Full HTML document string
 * @param outPath  Absolute path for the output PNG
 */
export async function htmlToPng(html: string, outPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    await page.screenshot({ path: outPath as `${string}.png`, type: 'png' })
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/instagram/export.ts
git commit -m "feat: instagram puppeteer PNG export"
```

---

## Task 8: Calendar builder

**Files:**
- Create: `scripts/instagram/calendar.ts`
- Test: `scripts/instagram/calendar.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/instagram/calendar.test.ts
import { describe, it, expect } from 'vitest'
import { buildCalendar } from './calendar'
import type { WeeklyBatch } from './types'

const batch: WeeklyBatch = {
  weekLabel: '2026-W14',
  posts: [
    { day: 'mon', filename: 'mon-job-spotlight', data: {
      type: 'job-spotlight', id: 'j1', title: 'Animator', company: 'EA',
      location: 'Remote', remote: true, discipline: 'Art & VFX',
      postedAt: '2026-03-24', applyUrl: 'https://ea.com',
    }},
    { day: 'thu', filename: 'thu-industry-stat', data: {
      type: 'industry-stat', stat: '73% self-taught', context: 'source: survey',
    }},
  ],
}

describe('buildCalendar', () => {
  it('includes the week label', () => {
    expect(buildCalendar(batch)).toContain('2026-W14')
  })

  it('includes all post filenames', () => {
    const md = buildCalendar(batch)
    expect(md).toContain('mon-job-spotlight')
    expect(md).toContain('thu-industry-stat')
  })

  it('returns a markdown string', () => {
    expect(buildCalendar(batch)).toContain('#')
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run scripts/instagram/calendar.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement calendar.ts**

```typescript
// scripts/instagram/calendar.ts
import type { WeeklyBatch, WeekPost } from './types'

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sun: 'Sunday',
}

function postSummary(p: WeekPost): string {
  const { data } = p
  switch (data.type) {
    case 'job-spotlight':    return `**${data.title}** @ ${data.company}`
    case 'tutorial':         return `**${data.title}**`
    case 'studio-feature':   return `**${data.name}** — ${data.openRoles} open roles`
    case 'industry-stat':    return `_${data.stat}_`
    case 'dev-log':          return `**${data.title}** by ${data.authorName}`
    case 'weekly-roundup':   return `${data.jobCount} new roles + ${data.highlights.length} highlights`
  }
}

export function buildCalendar(batch: WeeklyBatch): string {
  const rows = batch.posts.map(p => {
    const day = DAY_NAMES[p.day] ?? p.day
    const summary = postSummary(p)
    return `| ${day} | ${p.filename}.png | ${summary} |`
  }).join('\n')

  return `# Loadout Instagram — Week ${batch.weekLabel}

| Day | File | Content |
|-----|------|---------|
${rows}

---
*Review each .md file for captions before scheduling.*
*Schedule using Buffer, Later, or Meta Business Suite.*
`
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run scripts/instagram/calendar.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram/calendar.ts scripts/instagram/calendar.test.ts
git commit -m "feat: instagram calendar.md builder"
```

---

## Task 9: Main orchestrator

**Files:**
- Create: `scripts/instagram.ts`

This ties all modules together. No separate unit test — verified by running the script end-to-end.

- [ ] **Step 1: Implement scripts/instagram.ts**

```typescript
// scripts/instagram.ts
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fetchJobs, fetchContent, fetchStudios, fetchJobCountThisWeek } from './instagram/fetch'
import { loadUsed, saveUsed, pickUnused, markUsed } from './instagram/select'
import { buildCard } from './instagram/cards'
import { buildCaption } from './instagram/captions'
import { htmlToPng } from './instagram/export'
import { buildCalendar } from './instagram/calendar'
import type { WeeklyBatch, WeekPost, PostData, UsedIds } from './instagram/types'

// ─── Industry stats seed ────────────────────────────────────────────────────

const STATS = [
  { stat: '73%', context: 'of game devs are self-taught in at least one discipline' },
  { stat: '$180B+', context: 'global games market revenue in 2023' },
  { stat: '1 in 4', context: 'game dev job listings require a degree' },
  { stat: '12+ years', context: 'average game dev career span' },
  { stat: '50%+', context: 'of Steam titles released annually are indie games' },
  { stat: '3x', context: 'growth in remote game dev roles since 2020' },
  { stat: '70%+', context: 'of shipped games use Unity or Unreal Engine' },
]

// ─── Week label ──────────────────────────────────────────────────────────────

function getWeekLabel(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 Loadout Instagram Pipeline starting...\n')

  const weekLabel = getWeekLabel()
  const outDir = path.resolve(`instagram/week-${weekLabel}`)
  fs.mkdirSync(outDir, { recursive: true })

  // Load dedup state
  let used = loadUsed()

  // Fetch all data in parallel
  console.log('📡 Fetching content from Supabase...')
  const [jobs, tutorials, studios, devlogs, jobCount] = await Promise.all([
    fetchJobs(),
    fetchContent('tutorial'),
    fetchStudios(),
    fetchContent('devlog'),
    fetchJobCountThisWeek(),
  ])
  console.log(`  Jobs: ${jobs.length}, Tutorials: ${tutorials.length}, Studios: ${studios.length}, DevLogs: ${devlogs.length}\n`)

  // Pick stat (cycle through seed list using a simple index stored in used)
  const statIndex = (used as any)._statIndex ?? 0
  const statSeed = STATS[statIndex % STATS.length]

  // Build post data for each slot
  const job = pickUnused(jobs, 'job-spotlight', used)
  const tutorial = pickUnused(tutorials, 'tutorial', used)
  const studio = pickUnused(studios, 'studio-feature', used)
  const devlog = pickUnused(devlogs, 'dev-log', used)

  const posts: Array<{ day: WeekPost['day']; filename: string; data: PostData }> = []

  if (job) {
    posts.push({ day: 'mon', filename: 'mon-job-spotlight', data: {
      type: 'job-spotlight', id: job.id, title: job.title, company: job.company,
      location: job.location, remote: job.remote, salaryBand: job.salaryBand,
      salary: job.salary, discipline: job.discipline, postedAt: job.postedAt,
      applyUrl: job.applyUrl,
    }})
    used = markUsed(used, 'job-spotlight', job.id)
  }

  if (tutorial) {
    posts.push({ day: 'tue', filename: 'tue-tutorial', data: {
      type: 'tutorial', id: tutorial.id, title: tutorial.title,
      slug: (tutorial as any).slug ?? tutorial.id, tags: tutorial.tags,
    }})
    used = markUsed(used, 'tutorial', tutorial.id)
  }

  if (studio) {
    posts.push({ day: 'wed', filename: 'wed-studio-feature', data: {
      type: 'studio-feature', id: studio.id, name: studio.name,
      slug: (studio as any).slug ?? studio.id,
      location: studio.location,
      // Count open roles for this studio from fetched jobs
      openRoles: jobs.filter(j => j.studioId === studio.id || j.company.toLowerCase() === studio.name.toLowerCase()).length,
      description: studio.description,
    }})
    used = markUsed(used, 'studio-feature', studio.id)
  }

  posts.push({ day: 'thu', filename: 'thu-industry-stat', data: {
    type: 'industry-stat', stat: statSeed.stat, context: statSeed.context,
  }})

  if (devlog) {
    posts.push({ day: 'fri', filename: 'fri-dev-log', data: {
      type: 'dev-log', id: devlog.id, title: devlog.title,
      slug: (devlog as any).slug ?? devlog.id,
      authorName: (devlog as any).author?.name ?? 'Loadout',
      tags: devlog.tags,
    }})
    used = markUsed(used, 'dev-log', devlog.id)
  }

  const highlights = [
    tutorial ? `New tutorial: ${tutorial.title}` : null,
    devlog ? `Dev log: ${devlog.title}` : null,
    studio ? `Studio spotlight: ${studio.name}` : null,
  ].filter(Boolean) as string[]

  posts.push({ day: 'sun', filename: 'sun-weekly-roundup', data: {
    type: 'weekly-roundup', jobCount,
    highlights: highlights.slice(0, 3),
    studioHighlight: studio ? `${studio.name} is hiring` : undefined,
  }})

  // Save updated dedup state
  ;(used as any)._statIndex = statIndex + 1
  saveUsed(used)

  const batch: WeeklyBatch = { weekLabel, posts }

  // Generate cards + captions
  console.log(`📸 Generating ${posts.length} post cards...\n`)
  for (const post of posts) {
    process.stdout.write(`  ${post.filename}... `)
    const html = buildCard(post.data)
    const caption = buildCaption(post.data)
    const pngPath = path.join(outDir, `${post.filename}.png`)
    const mdPath = path.join(outDir, `${post.filename}.md`)
    await htmlToPng(html, pngPath)
    fs.writeFileSync(mdPath, caption)
    console.log('✓')
  }

  // Write calendar
  const calPath = path.join(outDir, 'calendar.md')
  fs.writeFileSync(calPath, buildCalendar(batch))

  console.log(`\n✅ Done! Output: instagram/week-${weekLabel}/`)
  console.log(`   Review captions in .md files, then schedule via Buffer or Later.`)
}

main().catch(err => {
  console.error('Pipeline failed:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Run all tests to confirm nothing broken**

```bash
npx vitest run scripts/instagram/
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/instagram.ts
git commit -m "feat: instagram pipeline orchestrator"
```

---

## Task 10: End-to-end verification

- [ ] **Step 1: Ensure env vars are set**

Check `.env.local` contains:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

If missing, copy from your Supabase dashboard → Settings → API.

- [ ] **Step 2: Run the pipeline**

```bash
npm run instagram
```

Expected output:
```
🎮 Loadout Instagram Pipeline starting...

📡 Fetching content from Supabase...
  Jobs: N, Tutorials: N, Studios: N, DevLogs: N

📸 Generating 6 post cards...

  mon-job-spotlight... ✓
  tue-tutorial... ✓
  wed-studio-feature... ✓
  thu-industry-stat... ✓
  fri-dev-log... ✓
  sun-weekly-roundup... ✓

✅ Done! Output: instagram/week-YYYY-WNN/
```

- [ ] **Step 3: Verify output folder**

```bash
ls instagram/week-*/
```

Expected: 12 files (6 `.png` + 6 `.md`) + `calendar.md`.

- [ ] **Step 4: Open a card to verify visual quality**

Open any `.png` in the output folder. Confirm:
- 1080×1080px
- Dark background, orange accent
- LOADOUT logo bottom-left, builtloadout.com bottom-right
- Real content (actual job title, studio name, etc.)

- [ ] **Step 5: Add instagram/ output to .gitignore**

```bash
echo "instagram/" >> .gitignore
echo ".superpowers/" >> .gitignore
```

```bash
git add .gitignore
git commit -m "chore: ignore instagram output and superpowers dirs"
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git status  # confirm only expected files
git commit -m "feat: complete instagram content pipeline — run npm run instagram weekly"
```
