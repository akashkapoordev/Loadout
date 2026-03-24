/**
 * Loadout data sync — fetches live jobs from Remotive + articles from Dev.to
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

/** Derive content type from Dev.to article tags. */
function contentType(tags: string[]): 'tutorial' | 'article' | 'devlog' | 'guide' {
  const all = tags.join(' ').toLowerCase()
  if (/tutorial|how.?to|learn|getting.?started/.test(all)) return 'tutorial'
  if (/guide|tips|best.?practice|checklist/.test(all))     return 'guide'
  if (/devlog|dev.?log|progress|update|journey/.test(all)) return 'devlog'
  return 'article'
}

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

  // Try game-related categories + a direct search
  const urls = [
    'https://remotive.com/api/remote-jobs?search=game+developer&limit=50',
    'https://remotive.com/api/remote-jobs?search=game+designer&limit=30',
    'https://remotive.com/api/remote-jobs?search=game+artist&limit=20',
    'https://remotive.com/api/remote-jobs?search=game+engineer&limit=20',
    'https://remotive.com/api/remote-jobs?search=unity+developer&limit=20',
    'https://remotive.com/api/remote-jobs?search=unreal+engine&limit=20',
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

  console.log(`  Found ${allJobs.length} unique jobs`)
  if (allJobs.length === 0) return

  const rows = allJobs.map(j => ({
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
    salary_band:      j.salary ? '$50-100k' : null,   // Remotive doesn't always have bands
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

  const { error } = await supabase
    .from('jobs')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

  if (error) console.error('  ✗ Jobs upsert error:', error.message)
  else       console.log(`  ✓ Upserted ${rows.length} jobs`)
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

  const tags = ['gamedev', 'gamedevelopment', 'unity', 'unrealengine', 'indiegame', 'gamejam']
  const allArticles: DevToArticle[] = []
  const seenIds = new Set<number>()

  for (const tag of tags) {
    try {
      const url = `https://dev.to/api/articles?tag=${tag}&per_page=20&top=7`
      const res = await fetch(url, { headers: { 'api-key': '' } })  // no key needed for public
      if (!res.ok) { console.warn(`  ⚠ tag=${tag} → ${res.status}`); continue }
      const articles = await res.json() as DevToArticle[]
      for (const a of articles) {
        if (!seenIds.has(a.id)) { seenIds.add(a.id); allArticles.push(a) }
      }
    } catch (e) {
      console.warn('  ⚠ Fetch error:', e)
    }
  }

  console.log(`  Found ${allArticles.length} unique articles`)
  if (allArticles.length === 0) return

  const rows = allArticles.map(a => ({
    id:           `devto-${a.id}`,
    type:         contentType(a.tag_list),
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

  const { error } = await supabase
    .from('content_items')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

  if (error) console.error('  ✗ Content upsert error:', error.message)
  else       console.log(`  ✓ Upserted ${rows.length} articles`)
}

// ─── Stats refresh ────────────────────────────────────────────────────────────

async function refreshStats() {
  console.log('→ Refreshing platform stats...')

  const [{ count: jobs }, { count: articles }, { count: studios }] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('content_items').select('*', { count: 'exact', head: true }),
    supabase.from('studios').select('*', { count: 'exact', head: true }),
  ])

  const { error } = await supabase
    .from('platform_stats')
    .update({
      open_roles: jobs ?? 0,
      articles:   articles ?? 0,
      studios:    studios ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) console.error('  ✗ Stats update error:', error.message)
  else       console.log(`  ✓ Stats: ${jobs} jobs, ${articles} articles, ${studios} studios`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━ Loadout sync starting', new Date().toISOString(), '━━━')
  await syncJobs()
  await syncContent()
  await refreshStats()
  console.log('━━━ Sync complete ━━━')
}

main().catch(e => { console.error(e); process.exit(1) })
