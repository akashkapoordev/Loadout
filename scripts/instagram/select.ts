// scripts/instagram/select.ts
import fs from 'fs'
import path from 'path'
import type { UsedIds } from './types'

const USED_FILE = path.resolve('instagram/.used.json')

type HasId = { id: string }

export function freshUsed(): UsedIds {
  return { 'job-spotlight': [], tutorial: [], 'studio-feature': [], 'dev-log': [] }
}

export function loadUsed(): UsedIds {
  if (!fs.existsSync(USED_FILE)) return freshUsed()
  try {
    return JSON.parse(fs.readFileSync(USED_FILE, 'utf-8')) as UsedIds
  } catch {
    return freshUsed()
  }
}

export function saveUsed(used: UsedIds): void {
  fs.mkdirSync(path.dirname(USED_FILE), { recursive: true })
  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2))
}

export function markUsed(used: UsedIds, type: keyof UsedIds, id: string): UsedIds {
  const bucket = used[type]
  if (bucket.includes(id)) return used
  return { ...used, [type]: [...bucket, id] }
}

export function pickUnused<T extends HasId>(
  items: T[],
  type: keyof UsedIds,
  used: UsedIds
): T | null {
  if (items.length === 0) return null
  const usedIds = used[type]
  const fresh = items.find(i => !usedIds.includes(i.id))
  if (fresh) return fresh
  // All used — cycle: return oldest (first item, which is least-recently used)
  return items[0]
}
