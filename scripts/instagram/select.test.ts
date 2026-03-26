// scripts/instagram/select.test.ts
import { describe, it, expect } from 'vitest'
import { pickUnused, markUsed, loadUsed, freshUsed } from './select'
import type { UsedIds } from './types'

const baseUsed: UsedIds = {
  'job-spotlight': [],
  tutorial: [],
  'studio-feature': [],
  'dev-log': [],
}

describe('pickUnused', () => {
  it('picks the first item when none used', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = pickUnused(items, 'job-spotlight', baseUsed)
    expect(result?.id).toBe('a')
  })

  it('skips already-used IDs', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const used: UsedIds = { ...baseUsed, 'job-spotlight': ['a'] }
    const result = pickUnused(items, 'job-spotlight', used)
    expect(result?.id).toBe('b')
  })

  it('cycles back to oldest when all used', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const used: UsedIds = { ...baseUsed, 'job-spotlight': ['a', 'b'] }
    const result = pickUnused(items, 'job-spotlight', used)
    expect(result?.id).toBe('a')
  })

  it('returns null when items array is empty', () => {
    const result = pickUnused([], 'job-spotlight', baseUsed)
    expect(result).toBeNull()
  })
})

describe('markUsed', () => {
  it('adds id to the correct type bucket', () => {
    const used = markUsed(baseUsed, 'tutorial', 'tut-1')
    expect(used.tutorial).toContain('tut-1')
    expect(used['job-spotlight']).toHaveLength(0)
  })

  it('does not duplicate existing id', () => {
    const used: UsedIds = { ...baseUsed, tutorial: ['tut-1'] }
    const result = markUsed(used, 'tutorial', 'tut-1')
    expect(result.tutorial).toHaveLength(1)
  })
})

describe('freshUsed', () => {
  it('returns empty buckets', () => {
    const u = freshUsed()
    expect(u['job-spotlight']).toEqual([])
    expect(u.tutorial).toEqual([])
  })
})
