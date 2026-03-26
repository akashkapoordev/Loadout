// scripts/instagram.ts
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fetchJobs, fetchContent, fetchStudios, fetchJobCountThisWeek } from './instagram/fetch'
import { loadUsed, saveUsed, pickUnused, markUsed } from './instagram/select'
import { buildCard } from './instagram/cards'
import { buildCaption } from './instagram/captions'
import { htmlToPng } from './instagram/export'
import { buildCalendar } from './instagram/calendar'
import type { WeeklyBatch, WeekPost, PostData, UsedIds } from './instagram/types'

// ─── Industry stats seed ────────────────────────────────────────────────────

const STATS = [
  { stat: '73%', context: 'of game devs are self-taught in at least one discipline' },
  { stat: '$180B+', context: 'global games market revenue in 2023' },
  { stat: '1 in 4', context: 'game dev job listings require a degree' },
  { stat: '12+ years', context: 'average game dev career span' },
  { stat: '50%+', context: 'of Steam titles released annually are indie games' },
  { stat: '3x', context: 'growth in remote game dev roles since 2020' },
  { stat: '70%+', context: 'of shipped games use Unity or Unreal Engine' },
]

// ─── Week label ──────────────────────────────────────────────────────────────

function getWeekLabel(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 Loadout Instagram Pipeline starting...\n')

  const weekLabel = getWeekLabel()
  const outDir = path.resolve(`instagram/week-${weekLabel}`)
  fs.mkdirSync(outDir, { recursive: true })

  // Load dedup state
  let used = loadUsed()

  // Fetch all data in parallel
  console.log('📡 Fetching content from Supabase...')
  const [jobs, tutorials, studios, devlogs, jobCount] = await Promise.all([
    fetchJobs(),
    fetchContent('tutorial'),
    fetchStudios(),
    fetchContent('devlog'),
    fetchJobCountThisWeek(),
  ])
  console.log(`  Jobs: ${jobs.length}, Tutorials: ${tutorials.length}, Studios: ${studios.length}, DevLogs: ${devlogs.length}\n`)

  // Pick stat (cycle through seed list)
  const statIndex = (used as any)._statIndex ?? 0
  const statSeed = STATS[statIndex % STATS.length]

  // Pick content avoiding duplicates
  const job = pickUnused(jobs, 'job-spotlight', used)
  const tutorial = pickUnused(tutorials, 'tutorial', used)
  const studio = pickUnused(studios, 'studio-feature', used)
  const devlog = pickUnused(devlogs, 'dev-log', used)

  const posts: Array<{ day: WeekPost['day']; filename: string; data: PostData }> = []

  // Note: fetch.ts returns snake_case DB fields (posted_at, apply_url, salary_band)
  if (job) {
    posts.push({ day: 'mon', filename: 'mon-job-spotlight', data: {
      type: 'job-spotlight',
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
      salaryBand: job.salary_band,
      discipline: job.discipline,
      postedAt: job.posted_at,
      applyUrl: job.apply_url,
    }})
    used = markUsed(used, 'job-spotlight', job.id)
  }

  if (tutorial) {
    posts.push({ day: 'tue', filename: 'tue-tutorial', data: {
      type: 'tutorial',
      id: tutorial.id,
      title: tutorial.title,
      slug: (tutorial as any).slug ?? tutorial.id,
      tags: (tutorial as any).tags ?? [],
    }})
    used = markUsed(used, 'tutorial', tutorial.id)
  }

  if (studio) {
    posts.push({ day: 'wed', filename: 'wed-studio-feature', data: {
      type: 'studio-feature',
      id: studio.id,
      name: studio.name,
      slug: (studio as any).slug ?? studio.id,
      location: studio.location,
      openRoles: jobs.filter(j =>
        j.company.toLowerCase() === studio.name.toLowerCase()
      ).length,
      description: studio.description,
    }})
    used = markUsed(used, 'studio-feature', studio.id)
  }

  posts.push({ day: 'thu', filename: 'thu-industry-stat', data: {
    type: 'industry-stat',
    stat: statSeed.stat,
    context: statSeed.context,
  }})

  if (devlog) {
    posts.push({ day: 'fri', filename: 'fri-dev-log', data: {
      type: 'dev-log',
      id: devlog.id,
      title: devlog.title,
      slug: (devlog as any).slug ?? devlog.id,
      authorName: (devlog as any).author_name ?? (devlog as any).author?.name ?? 'Loadout',
      tags: (devlog as any).tags ?? [],
    }})
    used = markUsed(used, 'dev-log', devlog.id)
  }

  const highlights = [
    tutorial ? `New tutorial: ${tutorial.title}` : null,
    devlog ? `Dev log: ${devlog.title}` : null,
    studio ? `Studio spotlight: ${studio.name}` : null,
  ].filter(Boolean) as string[]

  posts.push({ day: 'sun', filename: 'sun-weekly-roundup', data: {
    type: 'weekly-roundup',
    jobCount,
    highlights: highlights.slice(0, 3),
    studioHighlight: studio ? `${studio.name} is hiring` : undefined,
  }})

  // Save updated dedup state
  ;(used as any)._statIndex = statIndex + 1
  saveUsed(used)

  const batch: WeeklyBatch = { weekLabel, posts }

  // Generate cards + captions
  console.log(`📸 Generating ${posts.length} post cards...\n`)
  for (const post of posts) {
    process.stdout.write(`  ${post.filename}... `)
    const html = buildCard(post.data)
    const caption = buildCaption(post.data)
    const pngPath = path.join(outDir, `${post.filename}.png`)
    const mdPath = path.join(outDir, `${post.filename}.md`)
    await htmlToPng(html, pngPath)
    fs.writeFileSync(mdPath, caption)
    console.log('✓')
  }

  // Write calendar
  const calPath = path.join(outDir, 'calendar.md')
  fs.writeFileSync(calPath, buildCalendar(batch))

  console.log(`\n✅ Done! Output: instagram/week-${weekLabel}/`)
  console.log(`   Review captions in .md files, then schedule via Buffer or Later.`)
}

main().catch(err => {
  console.error('Pipeline failed:', err)
  process.exit(1)
})
