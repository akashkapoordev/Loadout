import { supabase } from './supabase'
import type {
  Job, Studio, ContentItem, ContentItemWithAuthor,
  ActivityItem, PlatformStats, Author,
  PaginatedResponse, SingleResponse,
  JobFilters, ContentFilters,
} from './types'

// ─── JOBS ────────────────────────────────────────────────────

export async function fetchJobs(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
  let q = supabase.from('jobs').select('*', { count: 'exact' }).eq('status', 'active')

  if (filters.discipline)      q = q.eq('discipline', filters.discipline)
  if (filters.disciplines && filters.disciplines.length > 0) q = q.in('discipline', filters.disciplines)
  if (filters.remote !== undefined) q = q.eq('remote', filters.remote)
  if (filters.salaryBand)      q = q.eq('salary_band', filters.salaryBand)
  if (filters.experienceLevel) q = q.eq('experience_level', filters.experienceLevel)
  if (filters.location)        q = q.ilike('location', `%${filters.location}%`)
  if (filters.studioId)        q = q.eq('studio_id', filters.studioId)

  const page  = filters.page  ?? 1
  const limit = filters.limit ?? 10
  const from  = (page - 1) * limit
  q = q.range(from, from + limit - 1).order('posted_at', { ascending: false })

  const { data, count, error } = await q
  if (error) throw error
  return { data: (data ?? []).map(mapJob), total: count ?? 0, page, limit }
}

export async function fetchJob(id: string): Promise<SingleResponse<Job>> {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).eq('status', 'active').single()
  if (error) throw error
  return { data: mapJob(data) }
}

// ─── STUDIOS ─────────────────────────────────────────────────

export async function fetchStudios(): Promise<SingleResponse<Studio[]>> {
  const { data, error } = await supabase.from('studios').select('*').order('name')
  if (error) throw error
  return { data: (data ?? []).map(mapStudio) }
}

export async function fetchStudio(id: string): Promise<SingleResponse<Studio>> {
  const { data, error } = await supabase.from('studios').select('*').eq('id', id).single()
  if (error) throw error
  return { data: mapStudio(data) }
}

export async function fetchStudioJobs(id: string): Promise<PaginatedResponse<Job>> {
  const { data, count, error } = await supabase
    .from('jobs').select('*', { count: 'exact' })
    .eq('studio_id', id).eq('status', 'active').order('posted_at', { ascending: false })
  if (error) throw error
  return { data: (data ?? []).map(mapJob), total: count ?? 0, page: 1, limit: count ?? 0 }
}

// ─── CONTENT ─────────────────────────────────────────────────

export async function fetchContent(filters: ContentFilters = {}): Promise<PaginatedResponse<ContentItem>> {
  let q = supabase.from('public_content_items').select('*', { count: 'exact' })

  if (filters.type) q = q.eq('type', filters.type)
  if (filters.tags && filters.tags.length > 0) q = q.overlaps('tags', filters.tags)

  const sort = filters.sort ?? 'latest'
  if (sort === 'latest')      q = q.order('published_at', { ascending: false })
  if (sort === 'most-viewed') q = q.order('views', { ascending: false })
  if (sort === 'top-rated')   q = q.order('rating', { ascending: false })

  const page  = filters.page  ?? 1
  const limit = filters.limit ?? 9
  const from  = (page - 1) * limit
  q = q.range(from, from + limit - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { data: (data ?? []).map(mapContent), total: count ?? 0, page, limit }
}

export async function fetchContentItem(id: string): Promise<SingleResponse<ContentItemWithAuthor>> {
  const { data: item, error } = await supabase
    .from('public_content_items').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!item) throw new Error('Content not found')
  const { data: author } = await supabase
    .from('authors').select('*').eq('id', item.author_id).single()
  return { data: { ...mapContent(item), author: author ? mapAuthor(author) : undefined } }
}

export async function fetchTrending(): Promise<SingleResponse<ContentItem[]>> {
  const { data, error } = await supabase
    .from('public_content_items').select('*').order('views', { ascending: false }).limit(4)
  if (error) throw error
  return { data: (data ?? []).map(mapContent) }
}

export async function fetchFeatured(): Promise<SingleResponse<ContentItem>> {
  const { data, error } = await supabase
    .from('public_content_items').select('*').order('rating', { ascending: false }).limit(1).single()
  if (error) throw error
  return { data: mapContent(data) }
}

// ─── AUTHORS ─────────────────────────────────────────────────

export async function fetchAuthor(id: string): Promise<SingleResponse<Author>> {
  const { data, error } = await supabase.from('authors').select('*').eq('id', id).single()
  if (error) throw error
  return { data: mapAuthor(data) }
}

// ─── ACTIVITY ────────────────────────────────────────────────

export async function fetchActivity(): Promise<SingleResponse<ActivityItem[]>> {
  const { data, error } = await supabase
    .from('activity_items').select('*').order('created_at', { ascending: false }).limit(10)
  if (error) throw error
  return { data: (data ?? []).map(mapActivity) }
}

// ─── STATS ───────────────────────────────────────────────────

export async function fetchStats(): Promise<SingleResponse<PlatformStats>> {
  const { data, error } = await supabase.from('platform_stats').select('*').eq('id', 1).single()
  if (error) throw error
  return { data: { openRoles: data.open_roles, studios: data.studios, members: data.members, articles: data.articles } }
}

// ─── STUDIO JOB COUNTS ───────────────────────────────────────
// Jobs synced from external APIs always have studio_id=null, so we also
// build a secondary map keyed by normalised company name for name-matching.

export async function fetchJobStudioCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('jobs').select('studio_id, company')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    // Prefer explicit FK link
    if (row.studio_id) {
      counts[row.studio_id] = (counts[row.studio_id] ?? 0) + 1
    }
    // Also index by normalised company name as fallback
    if (row.company) {
      const key = row.company.toLowerCase().trim()
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return counts
}

// ─── MAPPERS (snake_case DB → camelCase TS) ──────────────────

function mapJob(r: any): Job {
  return {
    id: r.id, studioId: r.studio_id, title: r.title,
    company: r.company, companyLogo: r.company_logo, companyColor: r.company_color,
    location: r.location, remote: r.remote, discipline: r.discipline,
    experienceLevel: r.experience_level, salaryBand: r.salary_band,
    salary: r.salary, tags: r.tags ?? [], postedAt: r.posted_at,
    description: r.description, applyUrl: r.apply_url,
  }
}

function mapStudio(r: any): Studio {
  return {
    id: r.id, name: r.name, logoInitials: r.logo_initials,
    logoColor: r.logo_color, logoBg: r.logo_bg, location: r.location,
    description: r.description, website: r.website, twitter: r.twitter,
    linkedin: r.linkedin, founded: r.founded, disciplines: r.disciplines ?? [],
  }
}

function mapContent(r: any): ContentItem {
  return {
    id: r.id, type: r.type, title: r.title, authorId: r.author_id,
    readTime: r.read_time, thumbnail: r.thumbnail, publishedAt: r.published_at,
    views: r.views, rating: r.rating, tags: r.tags ?? [],
    body: r.body ?? null,
    bodyTeaser: r.body_teaser ?? '',
    sourceUrl: r.source_url ?? undefined,
    isPremium: r.is_premium ?? false,
  }
}

function mapAuthor(r: any): Author {
  return {
    id: r.id, name: r.name, avatar: r.avatar, role: r.role,
    bio: r.bio, twitter: r.twitter, linkedin: r.linkedin,
  }
}

function mapActivity(r: any): ActivityItem {
  return {
    id: r.id, type: r.type, message: r.message,
    highlight: r.highlight, color: r.color, createdAt: r.created_at,
  }
}
