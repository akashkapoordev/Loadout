import { jobs } from './data/jobs'
import { studios } from './data/studios'
import { contentItems } from './data/content'
import { authors } from './data/authors'
import { activityItems } from './data/activity'
import { platformStats } from './data/stats'
import type {
  Job,
  Studio,
  ContentItem,
  ContentItemWithAuthor,
  ActivityItem,
  PlatformStats,
  PaginatedResponse,
  SingleResponse,
  JobFilters,
  ContentFilters,
} from '../lib/types'

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

// --- Jobs ---

export async function getJobs(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
  await delay()
  let results = [...jobs]

  if (filters.discipline) {
    results = results.filter(j => j.discipline === filters.discipline)
  }
  if (filters.remote !== undefined) {
    results = results.filter(j => j.remote === filters.remote)
  }
  if (filters.salaryBand) {
    results = results.filter(j => j.salaryBand === filters.salaryBand)
  }
  if (filters.experienceLevel) {
    results = results.filter(j => j.experienceLevel === filters.experienceLevel)
  }
  if (filters.studioId) {
    results = results.filter(j => j.studioId === filters.studioId)
  }

  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const start = (page - 1) * limit
  const paginated = results.slice(start, start + limit)

  return { data: paginated, total: results.length, page, limit }
}

export async function getJob(id: string): Promise<SingleResponse<Job>> {
  await delay()
  const job = jobs.find(j => j.id === id)
  if (!job) throw new Error(`Job not found: ${id}`)
  return { data: job }
}

// --- Studios ---

export async function getStudios(): Promise<SingleResponse<Studio[]>> {
  await delay()
  const studiosWithCounts = studios.map(s => ({
    ...s,
    openRoles: jobs.filter(j => j.studioId === s.id).length,
  }))
  return { data: studiosWithCounts }
}

export async function getStudio(id: string): Promise<SingleResponse<Studio>> {
  await delay()
  const studio = studios.find(s => s.id === id)
  if (!studio) throw new Error(`Studio not found: ${id}`)
  return { data: studio }
}

export async function getStudioJobs(id: string): Promise<PaginatedResponse<Job>> {
  await delay()
  const results = jobs.filter(j => j.studioId === id)
  return { data: results, total: results.length, page: 1, limit: results.length }
}

// --- Content ---

export async function getContent(filters: ContentFilters = {}): Promise<PaginatedResponse<ContentItem>> {
  await delay()
  let results = [...contentItems]

  if (filters.type) {
    results = results.filter(c => c.type === filters.type)
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(c => filters.tags!.some(t => c.tags.includes(t)))
  }

  const sort = filters.sort ?? 'latest'
  if (sort === 'latest') {
    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  } else if (sort === 'most-viewed') {
    results.sort((a, b) => b.views - a.views)
  } else if (sort === 'top-rated') {
    results.sort((a, b) => b.rating - a.rating)
  }

  const page = filters.page ?? 1
  const limit = filters.limit ?? 9
  const start = (page - 1) * limit
  const paginated = results.slice(start, start + limit)

  return { data: paginated, total: results.length, page, limit }
}

export async function getContentItem(id: string): Promise<SingleResponse<ContentItemWithAuthor>> {
  await delay()
  const item = contentItems.find(c => c.id === id)
  if (!item) throw new Error(`Content item not found: ${id}`)
  const author = authors.find(a => a.id === item.authorId)
  if (!author) throw new Error(`Author not found: ${item.authorId}`)
  return { data: { ...item, author } }
}

export async function getTrending(): Promise<SingleResponse<ContentItem[]>> {
  await delay()
  const sorted = [...contentItems]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4)
  return { data: sorted }
}

export async function getFeatured(): Promise<SingleResponse<ContentItem>> {
  await delay()
  const featured = contentItems
    .filter(c => c.type === 'article')
    .sort((a, b) => b.rating - a.rating)[0]
  return { data: featured }
}

// --- Authors ---

export async function getAuthor(id: string): Promise<SingleResponse<typeof authors[0]>> {
  await delay()
  const author = authors.find(a => a.id === id)
  if (!author) throw new Error(`Author not found: ${id}`)
  return { data: author }
}

// --- Activity ---

export async function getActivity(): Promise<SingleResponse<ActivityItem[]>> {
  await delay(200)
  return { data: activityItems.slice(0, 10) }
}

// --- Stats ---

export async function getStats(): Promise<SingleResponse<PlatformStats>> {
  await delay(150)
  return { data: platformStats }
}
