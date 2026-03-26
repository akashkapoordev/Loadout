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
