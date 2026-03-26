// scripts/instagram/fetch.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// DB row shapes (snake_case from Supabase, looser than the site's camelCase types)
export interface DbJob {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  discipline: string
  posted_at: string
  apply_url: string
  salary_band?: string
  salary?: string
  [key: string]: unknown
}

export interface DbContent {
  id: string
  type: string
  title: string
  published_at: string
  [key: string]: unknown
}

export interface DbStudio {
  id: string
  name: string
  location: string
  description: string
  [key: string]: unknown
}

export async function fetchJobs(limit = 20): Promise<DbJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchJobs: ${error.message}`)
  return (data ?? []) as DbJob[]
}

export async function fetchContent(type: 'tutorial' | 'devlog', limit = 20): Promise<DbContent[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchContent(${type}): ${error.message}`)
  const rows = (data ?? []) as DbContent[]
  return rows.filter(r => r.type === type)
}

export async function fetchStudios(limit = 20): Promise<DbStudio[]> {
  const { data, error } = await supabase
    .from('studios')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`fetchStudios: ${error.message}`)
  return (data ?? []) as DbStudio[]
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
