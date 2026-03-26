// scripts/instagram/captions.test.ts
import { describe, it, expect } from 'vitest'
import { buildCaption } from './captions'
import type { JobPost, TutorialPost, StatPost } from './types'

describe('buildCaption – job-spotlight', () => {
  const post: JobPost = {
    type: 'job-spotlight',
    id: 'j1',
    title: 'Senior Concept Artist',
    company: 'Riot Games',
    location: 'Los Angeles',
    remote: true,
    salaryBand: '$100-150k',
    discipline: 'Art & VFX',
    postedAt: '2026-03-24',
    applyUrl: 'https://riotgames.com/jobs/1',
  }

  it('includes role and studio', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('Senior Concept Artist')
    expect(caption).toContain('Riot Games')
  })

  it('includes remote label', () => {
    expect(buildCaption(post)).toContain('Remote')
  })

  it('includes builtloadout.com/jobs link', () => {
    expect(buildCaption(post)).toContain('builtloadout.com/jobs')
  })

  it('includes discipline hashtag', () => {
    expect(buildCaption(post)).toContain('#artvfx')
  })
})

describe('buildCaption – tutorial', () => {
  const post: TutorialPost = {
    type: 'tutorial',
    id: 't1',
    title: 'Optimize Draw Calls in Unity',
    slug: 'optimize-draw-calls-unity',
    tags: ['unity', 'performance'],
  }

  it('includes title and link', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('Optimize Draw Calls in Unity')
    expect(caption).toContain('builtloadout.com/tutorials/optimize-draw-calls-unity')
  })

  it('includes tag hashtags', () => {
    const caption = buildCaption(post)
    expect(caption).toContain('#unity')
  })
})

describe('buildCaption – industry-stat', () => {
  const post: StatPost = {
    type: 'industry-stat',
    stat: '73% of game devs are self-taught',
    context: 'in at least one discipline',
  }

  it('includes stat text', () => {
    expect(buildCaption(post)).toContain('73% of game devs are self-taught')
  })

  it('includes builtloadout.com link', () => {
    expect(buildCaption(post)).toContain('builtloadout.com')
  })
})
