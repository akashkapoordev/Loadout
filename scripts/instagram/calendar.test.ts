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
