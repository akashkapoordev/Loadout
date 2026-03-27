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
  body: string | null   // null when content is premium-gated and user is not subscribed
  bodyTeaser?: string   // first 300 chars, always present from the view (Phase 2 addition)
  isPremium?: boolean   // true if this content requires a subscription
  sourceUrl?: string
}

export interface ContentItemWithAuthor extends ContentItem {
  author?: Author
}

export type Discipline =
  | 'Game Design'
  | 'Engineering'
  | 'Art & VFX'
  | 'Marketing'
  | 'Audio'
  | 'Writing'
  | 'Production'
  | 'Analytics'

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

// API response shapes
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
