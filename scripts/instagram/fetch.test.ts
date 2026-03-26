// scripts/instagram/fetch.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock supabase client
const resolveWith = (data: unknown[]) => ({
  order: () => ({
    limit: () => Promise.resolve({ data, error: null }),
  }),
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => resolveWith([]),
        order: () => ({
          limit: () => Promise.resolve({
            data: table === 'jobs'
              ? [{ id: 'j1', title: 'Animator', company: 'EA', location: 'London',
                   remote: false, discipline: 'Art & VFX', posted_at: '2026-03-20',
                   apply_url: 'https://ea.com/jobs/1', salary_band: '$60-100k' }]
              : [],
            error: null,
          }),
        }),
      }),
    }),
  }),
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
