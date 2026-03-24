/**
 * Loadout data sync — fetches live jobs from Remotive + Arbeitnow + articles from Dev.to
 * and upserts them into Supabase.
 *
 * Run manually:  npm run sync
 * Automated:     GitHub Actions every 6 hours
 *
 * Env vars required (put in .env.local or GitHub secrets):
 *   SUPABASE_URL              — same as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase → Settings → API
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive a stable hex color from any string. */
function colorFromString(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue},60%,35%)`
}

/** Pick up to 2 initials from a company name. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Extract experience level from a job title. */
function experienceLevel(title: string): string {
  const t = title.toLowerCase()
  if (/\b(principal|staff|director|vp|head of|chief)\b/.test(t)) return 'Lead'
  if (/\b(lead|sr\.?|senior)\b/.test(t))                          return 'Senior'
  if (/\b(jr\.?|junior|entry|associate|graduate|intern)\b/.test(t)) return 'Junior'
  return 'Mid'
}

/** Map Remotive category → our discipline values. */
function mapDiscipline(category: string): string {
  const map: Record<string, string> = {
    'Software Development': 'Engineering',
    'DevOps / Sysadmin':   'Engineering',
    'QA':                  'Engineering',
    'Design':              'Art & VFX',
    'Product':             'Production',
    'Marketing':           'Marketing',
    'Customer Support':    'Production',
    'Finance / Legal':     'Production',
    'Data':                'Analytics',
    'Writing':             'Writing',
  }
  return map[category] ?? 'Engineering'
}

/** Return true only if the job is clearly gaming-industry related. */
function isGameRelated(title: string, company: string, tags: string[]): boolean {
  const haystack = (title + ' ' + company + ' ' + tags.join(' ')).toLowerCase()
  return /\b(game|gaming|gamedev|esport|esports|unity|unreal|godot|vr|ar\b|xr\b|metaverse|studio|indie|aaa|console|playstation|xbox|nintendo|steam|mobile\s+game|game\s+engine|level\s+design|character\s+art|vfx|3d\s+artist|animator|rigger|gameplay|narrative\s+design|lore|quest\s+design|game\s+producer|game\s+tester|qa\s+game|audio\s+game|sound\s+design)\b/.test(haystack)
}

/** Derive content type from Dev.to article tags + title. */
function contentType(tags: string[], title = ''): 'tutorial' | 'article' | 'devlog' | 'guide' {
  const all = (tags.join(' ') + ' ' + title).toLowerCase()
  if (/devlog|dev.?log|progress\s+update|week\s+\d+|day\s+\d+|#\d+\s|log\s+#/.test(all)) return 'devlog'
  if (/\btutorial\b|how.?to\b|step.?by.?step|from.?scratch|build(ing)?\s+a|creat(e|ing)\s+a|implement/.test(all)) return 'tutorial'
  if (/\bguide\b|tips|best.?practice|checklist|roadmap|everything\s+you|complete\s+|ultimate\s+/.test(all))       return 'guide'
  return 'article'
}

/** Return true only if the content is clearly game-development related. */
function isGameContent(title: string, tags: string[]): boolean {
  const haystack = (title + ' ' + tags.join(' ')).toLowerCase()
  return /\b(game|gaming|gamedev|game\s*dev|indie|indiedev|unity|unreal|godot|phaser|cocos|gdscript|blueprint|level\s*design|game\s*design|game\s*engine|game\s*jam|pixel\s*art|sprite|tilemap|shader|vfx|rigging|animation|procedural|pathfinding|physics\s+engine|game\s+loop|collision|hitbox|ai\s+in\s+game|npc|rpg|fps|rts|mmo|moba|platformer|roguelike|open\s+world|narrative\s+design|quest|lore|game\s+art|concept\s+art|3d\s+model|texture|render|directx|opengl|vulkan|webgl|three\.?js|babylon\.?js|playcanvas|game\s+audio|sound\s+design|game\s+monetiz|mobile\s+game|console\s+dev|steam|itch\.io|playstation|xbox|nintendo|esport)\b/.test(haystack)
}

/** Small delay to avoid hammering APIs. */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Jobs sync (Remotive) ─────────────────────────────────────────────────────

interface RemotiveJob {
  id: number
  slug: string
  title: string
  company_name: string
  category: string
  candidate_required_location: string
  salary: string
  job_type: string
  publication_date: string
  description: string
  url: string
  tags: string[]
}

async function syncJobs() {
  console.log('→ Fetching jobs from Remotive...')

  const urls = [
    'https://remotive.com/api/remote-jobs?search=game+developer&limit=50',
    'https://remotive.com/api/remote-jobs?search=game+designer&limit=50',
    'https://remotive.com/api/remote-jobs?search=game+artist&limit=30',
    'https://remotive.com/api/remote-jobs?search=game+engineer&limit=30',
    'https://remotive.com/api/remote-jobs?search=unity+developer&limit=30',
    'https://remotive.com/api/remote-jobs?search=unreal+engine&limit=30',
    'https://remotive.com/api/remote-jobs?search=godot&limit=20',
    'https://remotive.com/api/remote-jobs?search=game+producer&limit=20',
    'https://remotive.com/api/remote-jobs?search=level+designer&limit=20',
    'https://remotive.com/api/remote-jobs?search=3d+artist+game&limit=20',
    'https://remotive.com/api/remote-jobs?search=gameplay+programmer&limit=20',
    'https://remotive.com/api/remote-jobs?search=vfx+artist+game&limit=20',
  ]

  const allJobs: RemotiveJob[] = []
  const seenIds = new Set<number>()

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) { console.warn(`  ⚠ ${url} → ${res.status}`); continue }
      const json = await res.json() as { jobs: RemotiveJob[] }
      for (const j of (json.jobs ?? [])) {
        if (!seenIds.has(j.id)) { seenIds.add(j.id); allJobs.push(j) }
      }
    } catch (e) {
      console.warn('  ⚠ Fetch error:', e)
    }
  }

  const filtered = allJobs.filter(j => isGameRelated(j.title, j.company_name, j.tags ?? []))
  console.log(`  Found ${allJobs.length} unique jobs → ${filtered.length} game-related`)
  if (filtered.length === 0) return

  const rows = filtered.map(j => ({
    id:               `remotive-${j.id}`,
    studio_id:        null,
    title:            j.title,
    company:          j.company_name,
    company_logo:     initials(j.company_name),
    company_color:    colorFromString(j.company_name),
    location:         j.candidate_required_location || 'Remote',
    remote:           true,
    discipline:       mapDiscipline(j.category),
    experience_level: experienceLevel(j.title),
    salary_band:      (() => {
      if (!j.salary) return null
      const s = j.salary.replace(/,/g, '')
      const nums = s.match(/\d+/g)?.map(Number) ?? []
      const val = nums.length ? Math.max(...nums) : 0
      if (val === 0)         return null
      if (val < 60000)       return '<$60k'
      if (val < 100000)      return '$60-100k'
      if (val < 150000)      return '$100-150k'
      return '$150k+'
    })(),
    salary:           j.salary || null,
    tags:             (j.tags ?? []).slice(0, 5),
    posted_at:        j.publication_date,
    description:      j.description
                        .replace(/<[^>]+>/g, ' ')       // strip HTML
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 2000),
    apply_url:        j.url,
    source:           'remotive',
  }))

  // Find which IDs are genuinely new before upserting
  const incomingIds = rows.map(r => r.id)
  const { data: existing } = await supabase
    .from('jobs').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = rows.filter(r => !existingIds.has(r.id))

  const { error } = await supabase
    .from('jobs')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

  if (error) { console.error('  ✗ Jobs upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${rows.length} jobs (${newRows.length} new)`)

  // Write activity items for new jobs (cap at 10 per sync to avoid feed spam)
  if (newRows.length > 0) {
    const activities = newRows.slice(0, 10).map(j => ({
      type:      'job_posted',
      message:   `${j.company} posted ${j.title}`,
      highlight: j.company,
      color:     'orange',
    }))
    const { error: actErr } = await supabase.from('activity_items').insert(activities)
    if (actErr) console.error('  ✗ Activity insert error (jobs):', actErr.message)
    else        console.log(`  ✓ Added ${activities.length} job activity items`)
  }
}

// ─── Content sync (Reddit) ───────────────────────────────────────────────────

interface RedditPost {
  id: string
  title: string
  selftext: string
  url: string
  score: number
  created_utc: number
  thumbnail: string
  preview?: { images: Array<{ source: { url: string } }> }
  permalink: string
  is_self: boolean
  subreddit: string
  author: string
}

const REDDIT_SUBS: Array<{ sub: string; defaultType: 'tutorial' | 'article' | 'devlog' | 'guide' }> = [
  { sub: 'gamedev',      defaultType: 'article' },
  { sub: 'indiedev',     defaultType: 'devlog' },
  { sub: 'unity3d',      defaultType: 'tutorial' },
  { sub: 'unrealengine', defaultType: 'tutorial' },
  { sub: 'godot',        defaultType: 'tutorial' },
  { sub: 'gamedesign',   defaultType: 'guide' },
]

function decodeHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
}

async function syncReddit() {
  console.log('→ Fetching posts from Reddit...')
  const allRows: object[] = []
  const seenIds = new Set<string>()

  for (const { sub, defaultType } of REDDIT_SUBS) {
    try {
      await sleep(2000)
      const url = `https://www.reddit.com/r/${sub}/top.json?limit=50&t=month&raw_json=1`
      const res = await fetch(url, { headers: {
        'User-Agent': 'Loadout/1.0 (gaming jobs and content aggregator; contact via github.com/akashkapoordev/Loadout)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }})
      if (!res.ok) { console.warn(`  ⚠ r/${sub} → ${res.status}`); continue }
      const json = await res.json() as { data: { children: Array<{ data: RedditPost }> } }
      const posts = (json.data?.children ?? []).map(c => c.data)

      let kept = 0
      for (const p of posts) {
        if (seenIds.has(p.id)) continue
        // Skip posts with no real text content and no external link
        if (!p.is_self && !p.url.startsWith('http')) continue
        // Skip posts that are just images/videos with no body
        if (!p.is_self && !p.selftext && /\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(p.url)) continue

        const body = p.selftext?.trim() || ''
        const thumbnail = p.preview?.images?.[0]?.source?.url
          ? decodeHtmlEntities(p.preview.images[0].source.url)
          : undefined

        seenIds.add(p.id)
        kept++
        allRows.push({
          id:           `reddit-${p.id}`,
          type:         contentType([], p.title) !== 'article' ? contentType([], p.title) : defaultType,
          title:        p.title,
          author_id:    null,
          read_time:    Math.max(1, Math.ceil(body.split(/\s+/).length / 200)),
          thumbnail:    thumbnail ?? null,
          published_at: new Date(p.created_utc * 1000).toISOString(),
          views:        p.score * 10,   // score → approximate views
          rating:       Math.min(5, parseFloat((p.score / 2000).toFixed(1))),
          tags:         [sub, 'gamedev'],
          body:         body.slice(0, 2000),
          source_url:   p.is_self
            ? `https://reddit.com${p.permalink}`
            : p.url,
          source:       'reddit',
        })
      }
      console.log(`  r/${sub}: ${kept} posts kept`)
    } catch (e) {
      console.warn(`  ⚠ Reddit error (r/${sub}):`, e)
    }
  }

  if (allRows.length === 0) { console.log('  No Reddit posts to upsert'); return }

  const incomingIds = (allRows as any[]).map(r => r.id)
  const { data: existing } = await supabase.from('content_items').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = (allRows as any[]).filter(r => !existingIds.has(r.id))

  const { error } = await supabase.from('content_items').upsert(allRows, { onConflict: 'id', ignoreDuplicates: false })
  if (error) { console.error('  ✗ Reddit upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${allRows.length} Reddit posts (${newRows.length} new)`)

  if (newRows.length > 0) {
    const activities = newRows.slice(0, 5).map((a: any) => ({
      type: 'content_published', message: `New post: ${a.title}`, highlight: a.title, color: 'cyan',
    }))
    await supabase.from('activity_items').insert(activities)
  }
}

// ─── Content sync (Hashnode) ──────────────────────────────────────────────────

const HASHNODE_TAGS = ['gamedev', 'unity', 'unreal-engine', 'godot', 'game-development', 'indiedev', 'game-design']

async function syncHashnode() {
  console.log('→ Fetching articles from Hashnode...')
  const allRows: object[] = []
  const seenIds = new Set<string>()

  for (const tag of HASHNODE_TAGS) {
    try {
      await sleep(500)
      const query = `{
        tag(slug: "${tag}") {
          posts(first: 20, filter: { sortBy: popular }) {
            edges {
              node {
                id title brief url publishedAt
                readTimeInMinutes
                coverImage { url }
                tags { name }
                author { name username }
              }
            }
          }
        }
      }`
      const res = await fetch('https://gql.hashnode.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) { console.warn(`  ⚠ Hashnode tag=${tag} → ${res.status}`); continue }
      const json = await res.json() as any
      const posts = json.data?.tag?.posts?.edges ?? []

      let kept = 0
      for (const { node: p } of posts) {
        if (!p?.id || seenIds.has(p.id)) continue
        seenIds.add(p.id)
        kept++
        const tags = (p.tags ?? []).map((t: any) => t.name?.toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
        allRows.push({
          id:           `hashnode-${p.id}`,
          type:         contentType(tags, p.title),
          title:        p.title,
          author_id:    null,
          read_time:    p.readTimeInMinutes || 5,
          thumbnail:    p.coverImage?.url ?? null,
          published_at: p.publishedAt,
          views:        0,
          rating:       0,
          tags:         tags.slice(0, 6),
          body:         p.brief ?? '',
          source_url:   p.url,
          source:       'hashnode',
        })
      }
      console.log(`  Hashnode tag=${tag}: ${kept} posts`)
    } catch (e) {
      console.warn(`  ⚠ Hashnode error (tag=${tag}):`, e)
    }
  }

  if (allRows.length === 0) { console.log('  No Hashnode posts to upsert'); return }

  const incomingIds = (allRows as any[]).map(r => r.id)
  const { data: existing } = await supabase.from('content_items').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = (allRows as any[]).filter(r => !existingIds.has(r.id))

  const { error } = await supabase.from('content_items').upsert(allRows, { onConflict: 'id', ignoreDuplicates: false })
  if (error) { console.error('  ✗ Hashnode upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${allRows.length} Hashnode posts (${newRows.length} new)`)
}

// ─── Content sync (Dev.to) ───────────────────────────────────────────────────

interface DevToArticle {
  id: number
  title: string
  description: string
  cover_image: string | null
  readable_publish_date: string
  published_at: string
  reading_time_minutes: number
  url: string
  page_views_count: number
  positive_reactions_count: number
  tag_list: string[]
  user: { name: string; username: string }
}

async function syncContent() {
  console.log('→ Fetching articles from Dev.to...')

  const searches: { tag: string; per_page: number; top: number }[] = [
    // ── Tutorials ──────────────────────────────────────
    { tag: 'unity',           per_page: 30, top: 30 },
    { tag: 'unrealengine',    per_page: 30, top: 30 },
    { tag: 'godot',           per_page: 30, top: 30 },
    { tag: 'gamedev',         per_page: 30, top: 14 },
    { tag: 'gamedevelopment', per_page: 20, top: 14 },
    // ── Dev Logs ───────────────────────────────────────
    { tag: 'devlog',          per_page: 30, top: 30 },
    { tag: 'indiedev',        per_page: 30, top: 30 },
    { tag: 'indiegame',       per_page: 20, top: 14 },
    { tag: 'gamejam',         per_page: 20, top: 14 },
    // ── Guides ─────────────────────────────────────────
    { tag: 'gamedesign',      per_page: 30, top: 30 },
    // ── Articles ───────────────────────────────────────
    { tag: 'gaming',          per_page: 20, top: 14 },
    { tag: 'webgamedev',      per_page: 15, top: 14 },
    { tag: 'pixelart',        per_page: 15, top: 14 },
  ]

  const allArticles: DevToArticle[] = []
  const seenIds = new Set<number>()

  for (const s of searches) {
    try {
      await sleep(400)
      const url = `https://dev.to/api/articles?tag=${s.tag}&per_page=${s.per_page}&top=${s.top}`
      const res = await fetch(url, { headers: { 'api-key': '' } })
      if (!res.ok) { console.warn(`  ⚠ tag=${s.tag} → ${res.status}`); continue }
      const articles = await res.json() as DevToArticle[]
      for (const a of articles) {
        if (!seenIds.has(a.id)) { seenIds.add(a.id); allArticles.push(a) }
      }
    } catch (e) {
      console.warn('  ⚠ Fetch error:', e)
    }
  }

  const gameArticles = allArticles.filter(a => isGameContent(a.title, a.tag_list))
  console.log(`  Found ${allArticles.length} unique articles → ${gameArticles.length} game-related`)
  if (gameArticles.length === 0) return

  const rows = gameArticles.map(a => ({
    id:           `devto-${a.id}`,
    type:         contentType(a.tag_list, a.title),
    title:        a.title,
    author_id:    null,
    read_time:    a.reading_time_minutes || 5,
    thumbnail:    a.cover_image ?? null,
    published_at: a.published_at,
    views:        a.page_views_count ?? 0,
    rating:       Math.min(5, parseFloat((a.positive_reactions_count / 40).toFixed(1))),
    tags:         a.tag_list.slice(0, 6),
    body:         a.description ?? '',
    source_url:   a.url,
    source:       'devto',
  }))

  // Find which IDs are genuinely new before upserting
  const incomingIds = rows.map(r => r.id)
  const { data: existing } = await supabase
    .from('content_items').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = rows.filter(r => !existingIds.has(r.id))

  const { error } = await supabase
    .from('content_items')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

  if (error) { console.error('  ✗ Content upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${rows.length} articles (${newRows.length} new)`)

  // Write activity items for new content (cap at 10 per sync)
  if (newRows.length > 0) {
    const typeLabel: Record<string, string> = {
      tutorial: 'New tutorial',
      article:  'New article',
      devlog:   'New dev log',
      guide:    'New guide',
    }
    const activities = newRows.slice(0, 10).map(a => ({
      type:      'content_published',
      message:   `${typeLabel[a.type] ?? 'New post'}: ${a.title}`,
      highlight: a.title,
      color:     'cyan',
    }))
    const { error: actErr } = await supabase.from('activity_items').insert(activities)
    if (actErr) console.error('  ✗ Activity insert error (content):', actErr.message)
    else        console.log(`  ✓ Added ${activities.length} content activity items`)
  }
}

// ─── Activity pruning ─────────────────────────────────────────────────────────

async function pruneActivity() {
  // Keep only the 100 most recent activity items
  const { data, error } = await supabase
    .from('activity_items')
    .select('id')
    .order('created_at', { ascending: false })
    .range(100, 10000)

  if (error || !data || data.length === 0) return

  const ids = data.map((r: { id: string }) => r.id)
  const { error: delErr } = await supabase.from('activity_items').delete().in('id', ids)
  if (delErr) console.error('  ✗ Activity prune error:', delErr.message)
  else        console.log(`  ✓ Pruned ${ids.length} old activity items`)
}

// ─── Jobs sync (Greenhouse — major game studios) ─────────────────────────────

interface GreenhouseJob {
  id: number
  title: string
  updated_at: string
  location: { name: string }
  departments: Array<{ name: string }>
  absolute_url: string
  content?: string
}

/** Map Greenhouse department name → our discipline values. */
function mapGreenhouseDepartment(dept: string): string {
  const d = dept.toLowerCase()
  if (/engineer|software|program|tech|devops|qa|test/.test(d))    return 'Engineering'
  if (/art|vfx|visual|anim|3d|concept|environment|character/.test(d)) return 'Art & VFX'
  if (/design|ux|ui/.test(d))                                      return 'Game Design'
  if (/audio|sound|music/.test(d))                                 return 'Audio'
  if (/market|growth|brand|social|community/.test(d))              return 'Marketing'
  if (/writ|narr|story|content/.test(d))                           return 'Writing'
  if (/data|analyt|insight|research/.test(d))                      return 'Analytics'
  return 'Production'
}

const GREENHOUSE_STUDIOS: Array<{ slug: string; name: string }> = [
  { slug: 'riotgamesinc',  name: 'Riot Games' },
  { slug: 'epicgames',     name: 'Epic Games' },
  { slug: 'bungie',        name: 'Bungie' },
  { slug: '2k',            name: '2K Games' },
  { slug: 'zyngacareers',  name: 'Zynga' },
  { slug: 'roblox',        name: 'Roblox' },
  { slug: 'supercell',     name: 'Supercell' },
  { slug: 'unity3d',       name: 'Unity Technologies' },
  { slug: 'discord',       name: 'Discord' },
  { slug: 'activision',    name: 'Activision' },
]

async function syncJobsGreenhouse() {
  console.log('→ Fetching jobs from Greenhouse (game studios)...')

  const allRows: ReturnType<typeof buildGreenhouseRow>[] = []

  for (const studio of GREENHOUSE_STUDIOS) {
    try {
      await sleep(500)
      const url = `https://boards-api.greenhouse.io/v1/boards/${studio.slug}/jobs?content=true`
      const res = await fetch(url)
      if (!res.ok) { console.warn(`  ⚠ ${studio.name} → ${res.status}`); continue }
      const json = await res.json() as { jobs: GreenhouseJob[] }
      const jobs = json.jobs ?? []
      const filtered = jobs.filter(j => isGameRelated(j.title, studio.name, j.departments.map(d => d.name)))
      console.log(`  ${studio.name}: ${jobs.length} jobs → ${filtered.length} game-related`)
      allRows.push(...filtered.map(j => buildGreenhouseRow(j, studio.name)))
    } catch (e) {
      console.warn(`  ⚠ Greenhouse fetch error (${studio.name}):`, e)
    }
  }

  if (allRows.length === 0) { console.log('  No Greenhouse jobs to upsert'); return }

  const incomingIds = allRows.map(r => r.id)
  const { data: existing } = await supabase.from('jobs').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = allRows.filter(r => !existingIds.has(r.id))

  const { error } = await supabase.from('jobs').upsert(allRows, { onConflict: 'id', ignoreDuplicates: false })
  if (error) { console.error('  ✗ Greenhouse upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${allRows.length} Greenhouse jobs (${newRows.length} new)`)

  if (newRows.length > 0) {
    const activities = newRows.slice(0, 10).map(j => ({
      type: 'job_posted', message: `${j.company} posted ${j.title}`, highlight: j.company, color: 'orange',
    }))
    await supabase.from('activity_items').insert(activities)
  }
}

function buildGreenhouseRow(j: GreenhouseJob, studioName: string) {
  const dept = j.departments[0]?.name ?? ''
  return {
    id:               `gh-${j.id}`,
    studio_id:        null,
    title:            j.title,
    company:          studioName,
    company_logo:     initials(studioName),
    company_color:    colorFromString(studioName),
    location:         j.location?.name || 'Remote',
    remote:           /remote/i.test(j.location?.name ?? ''),
    discipline:       mapGreenhouseDepartment(dept),
    experience_level: experienceLevel(j.title),
    salary_band:      null,
    salary:           null,
    tags:             dept ? [dept.toLowerCase().replace(/\s+/g, '-')] : [],
    posted_at:        j.updated_at, // Greenhouse API does not expose a published/created date; updated_at is the best available proxy
    description:      (j.content ?? '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 2000),
    apply_url:        j.absolute_url,
    source:           'greenhouse',
  }
}

// ─── Jobs sync (Arbeitnow) ────────────────────────────────────────────────────

interface ArbeitnowJob {
  slug:         string
  company_name: string
  title:        string
  description:  string
  remote:       boolean
  tags:         string[]
  job_types:    string[]
  location:     string
  url:          string
  created_at:   number  // unix timestamp
}

async function syncJobsArbeitnow() {
  console.log('→ Fetching jobs from Arbeitnow...')

  const searches = [
    'game+developer', 'game+designer', 'game+engineer',
    'unity+developer', 'unreal+engine', 'game+artist',
  ]

  const allJobs: ArbeitnowJob[] = []
  const seenSlugs = new Set<string>()

  for (const q of searches) {
    for (let page = 1; page <= 2; page++) {
      try {
        await sleep(1200)
        const url = `https://www.arbeitnow.com/api/job-board-api?search=${q}&page=${page}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) { console.warn(`  ⚠ arbeitnow ${q} p${page} → ${res.status}`); break }
        const json = await res.json() as { data: ArbeitnowJob[] }
        const jobs = json.data ?? []
        if (jobs.length === 0) break
        for (const j of jobs) {
          if (!seenSlugs.has(j.slug)) { seenSlugs.add(j.slug); allJobs.push(j) }
        }
      } catch (e) {
        console.warn('  ⚠ Fetch error:', e); break
      }
    }
  }

  const filtered = allJobs.filter(j => isGameRelated(j.title, j.company_name, j.tags ?? []))
  console.log(`  Found ${allJobs.length} unique jobs → ${filtered.length} game-related`)
  if (filtered.length === 0) return

  const rows = filtered.map(j => ({
    id:               `arbeitnow-${j.slug}`,
    studio_id:        null,
    title:            j.title,
    company:          j.company_name,
    company_logo:     initials(j.company_name),
    company_color:    colorFromString(j.company_name),
    location:         j.location || (j.remote ? 'Remote' : 'Unknown'),
    remote:           j.remote,
    discipline:       j.tags.find(t => /audio|sound|music/i.test(t)) ? 'Audio'    :
                        j.tags.find(t => /art|vfx|3d|anim/i.test(t))  ? 'Art & VFX':
                        j.tags.find(t => /design/i.test(t))            ? 'Game Design':
                        'Engineering',
    experience_level: experienceLevel(j.title),
    salary_band:      null,
    salary:           null,
    tags:             j.tags.slice(0, 5),
    posted_at:        new Date(j.created_at * 1000).toISOString(),
    description:      j.description
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 2000),
    apply_url:        j.url,
    source:           'arbeitnow',
  }))

  // Find which IDs are genuinely new before upserting
  const incomingIds = rows.map(r => r.id)
  const { data: existing } = await supabase
    .from('jobs').select('id').in('id', incomingIds)
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newRows = rows.filter(r => !existingIds.has(r.id))

  const { error } = await supabase
    .from('jobs')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

  if (error) { console.error('  ✗ Arbeitnow upsert error:', error.message); return }
  console.log(`  ✓ Upserted ${rows.length} jobs (${newRows.length} new)`)

  if (newRows.length > 0) {
    const activities = newRows.slice(0, 10).map(j => ({
      type:      'job_posted',
      message:   `${j.company} posted ${j.title}`,
      highlight: j.company,
      color:     'orange',
    }))
    const { error: actErr } = await supabase.from('activity_items').insert(activities)
    if (actErr) console.error('  ✗ Activity insert error (arbeitnow):', actErr.message)
    else        console.log(`  ✓ Added ${activities.length} job activity items`)
  }
}

// ─── Cleanup non-game jobs ────────────────────────────────────────────────────

async function cleanNonGameJobs() {
  console.log('→ Cleaning non-game jobs from DB...')

  // Fetch all jobs (id + title + company + tags) in batches
  let from = 0
  const batchSize = 1000
  const toDelete: string[] = []

  while (true) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, tags')
      .range(from, from + batchSize - 1)

    if (error) { console.error('  ✗ Fetch error:', error.message); break }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!isGameRelated(row.title ?? '', row.company ?? '', row.tags ?? [])) {
        toDelete.push(row.id)
      }
    }

    if (data.length < batchSize) break
    from += batchSize
  }

  if (toDelete.length === 0) {
    console.log('  ✓ No non-game jobs found')
    return
  }

  const { error } = await supabase.from('jobs').delete().in('id', toDelete)
  if (error) console.error('  ✗ Delete error:', error.message)
  else       console.log(`  ✓ Deleted ${toDelete.length} non-game jobs`)
}

// ─── Content cleanup ──────────────────────────────────────────────────────────

async function cleanNonGameContent() {
  console.log('→ Cleaning non-game content from DB...')

  let from = 0
  const batchSize = 1000
  const toDelete: string[] = []

  while (true) {
    const { data, error } = await supabase
      .from('content_items')
      .select('id, title, tags')
      .range(from, from + batchSize - 1)

    if (error) { console.error('  ✗ Fetch error:', error.message); break }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!isGameContent(row.title ?? '', row.tags ?? [])) {
        toDelete.push(row.id)
      }
    }

    if (data.length < batchSize) break
    from += batchSize
  }

  if (toDelete.length === 0) {
    console.log('  ✓ No non-game content found')
    return
  }

  const { error } = await supabase.from('content_items').delete().in('id', toDelete)
  if (error) console.error('  ✗ Delete error:', error.message)
  else       console.log(`  ✓ Deleted ${toDelete.length} non-game content items`)
}

// ─── Stats refresh ────────────────────────────────────────────────────────────

async function refreshStats() {
  console.log('→ Refreshing platform stats...')

  const [{ count: jobs }, { count: articles }, { count: studios }] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('content_items').select('*', { count: 'exact', head: true }),
    supabase.from('studios').select('*', { count: 'exact', head: true }),
  ])

  const { data: existingStats } = await supabase.from('platform_stats').select('members').eq('id', 1).single()
  const members = existingStats?.members ?? 0

  const { error } = await supabase
    .from('platform_stats')
    .upsert({
      id:         1,
      open_roles: jobs ?? 0,
      articles:   articles ?? 0,
      studios:    studios ?? 0,
      members,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: false })

  if (error) console.error('  ✗ Stats update error:', error.message)
  else       console.log(`  ✓ Stats: ${jobs} jobs, ${articles} articles, ${studios} studios`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
