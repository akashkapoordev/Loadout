// scripts/instagram/captions.ts
import type { PostData, JobPost, TutorialPost, StudioPost, StatPost, DevLogPost, RoundupPost } from './types'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function jobCaption(p: JobPost): string {
  const loc = p.remote ? 'Remote' : p.location
  const salary = p.salaryBand ?? p.salary ?? ''
  const salaryLine = salary ? `  💰 ${salary}` : ''
  const disciplineTag = `#${slug(p.discipline)}`
  const studioTag = `#${slug(p.company)}`
  return `🎮 ${p.title} @ ${p.company}

Join one of gaming's most sought-after teams.

📍 ${loc}${salaryLine}  🗓 Posted ${p.postedAt}

Apply + browse more roles → builtloadout.com/jobs

#gamedev #gamedevelopment #gamejobs ${disciplineTag} ${studioTag}`
}

function tutorialCaption(p: TutorialPost): string {
  const tags = p.tags.map(t => `#${slug(t)}`).join(' ')
  return `🛠 ${p.title}

Level up your skills with this step-by-step guide.

Full tutorial → builtloadout.com/tutorials/${p.slug}

#gamedev #gamedevelopment ${tags} #gamedevtips #indiedev`
}

function studioCaption(p: StudioPost): string {
  const studioTag = `#${slug(p.name)}`
  return `🏢 ${p.name}

${p.description.slice(0, 100).trimEnd()}…

${p.openRoles} open role${p.openRoles !== 1 ? 's' : ''} right now.

Browse → builtloadout.com/studios/${p.slug}

#gamedev #gamejobs ${studioTag} #gamedevelopment`
}

function statCaption(p: StatPost): string {
  return `📊 Did you know?

${p.stat}

${p.context}

More game dev insights → builtloadout.com

#gamedev #gamedevelopment #gameindustry #gamedevfacts`
}

function devlogCaption(p: DevLogPost): string {
  const tags = p.tags.slice(0, 2).map(t => `#${slug(t)}`).join(' ')
  return `📓 Dev Log: ${p.title}

Follow the build — raw progress, lessons learned, mistakes made.

by ${p.authorName} → builtloadout.com/dev-logs/${p.slug}

#devlog #indiedev #gamedev #gamedevelopment ${tags}`
}

function roundupCaption(p: RoundupPost): string {
  const bullets = p.highlights.map(h => `▸ ${h}`).join('\n')
  const studio = p.studioHighlight ? `▸ ${p.studioHighlight}\n` : ''
  return `📋 This week on Loadout

▸ ${p.jobCount} new role${p.jobCount !== 1 ? 's' : ''} posted
${bullets}
${studio}
Stay current → builtloadout.com

#gamedev #gamedevelopment #gamejobs #weeklyroundup #indiedev`
}

export function buildCaption(post: PostData): string {
  switch (post.type) {
    case 'job-spotlight':    return jobCaption(post)
    case 'tutorial':         return tutorialCaption(post)
    case 'studio-feature':   return studioCaption(post)
    case 'industry-stat':    return statCaption(post)
    case 'dev-log':          return devlogCaption(post)
    case 'weekly-roundup':   return roundupCaption(post)
  }
}
