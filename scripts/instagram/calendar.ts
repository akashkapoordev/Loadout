// scripts/instagram/calendar.ts
import type { WeeklyBatch, WeekPost } from './types'

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sun: 'Sunday',
}

function postSummary(p: WeekPost): string {
  const { data } = p
  switch (data.type) {
    case 'job-spotlight':    return `**${data.title}** @ ${data.company}`
    case 'tutorial':         return `**${data.title}**`
    case 'studio-feature':   return `**${data.name}** — ${data.openRoles} open roles`
    case 'industry-stat':    return `_${data.stat}_`
    case 'dev-log':          return `**${data.title}** by ${data.authorName}`
    case 'weekly-roundup':   return `${data.jobCount} new roles + ${data.highlights.length} highlights`
  }
}

export function buildCalendar(batch: WeeklyBatch): string {
  const rows = batch.posts.map(p => {
    const day = DAY_NAMES[p.day] ?? p.day
    const summary = postSummary(p)
    return `| ${day} | ${p.filename}.png | ${summary} |`
  }).join('\n')

  return `# Loadout Instagram — Week ${batch.weekLabel}

| Day | File | Content |
|-----|------|---------|
${rows}

---
*Review each .md file for captions before scheduling.*
*Schedule using Buffer, Later, or Meta Business Suite.*
`
}
