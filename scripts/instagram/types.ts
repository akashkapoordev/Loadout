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

export type ContentBucket = 'job-spotlight' | 'tutorial' | 'studio-feature' | 'dev-log'

export interface UsedIds {
  'job-spotlight': string[]
  tutorial: string[]
  'studio-feature': string[]
  'dev-log': string[]
  _statIndex?: number
}
