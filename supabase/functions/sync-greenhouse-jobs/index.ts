import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

type Discipline = 'Game Design' | 'Engineering' | 'Art & VFX' | 'Marketing' | 'Audio' | 'Writing' | 'Production' | 'Analytics'
type ExperienceLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead'

interface StudioConfig {
  studioId: string
  name: string
  logo: string
  color: string
  slug: string  // Greenhouse board token
}

// Studios confirmed to use Greenhouse — add more here as needed
const STUDIOS: StudioConfig[] = [
  // Already in DB
  { studioId: 'riot-games',        name: 'Riot Games',        logo: 'RG',  color: '#D0392B', slug: 'riotgames' },
  { studioId: 'insomniac-games',   name: 'Insomniac Games',   logo: 'IG',  color: '#6B21A8', slug: 'insomniac' },
  { studioId: 'bungie',            name: 'Bungie',            logo: 'BNG', color: '#4F87C5', slug: 'bungie' },
  { studioId: 'ghost-story-games', name: 'Ghost Story Games', logo: 'GSG', color: '#7C3AED', slug: 'gsgcareers' },
  { studioId: 'mojang-studios',    name: 'Mojang Studios',    logo: 'MJG', color: '#62B73B', slug: 'mojangab' },
  { studioId: 'monomi-park',       name: 'Monomi Park',       logo: 'MP',  color: '#FF6EC7', slug: 'monomipark' },
  { studioId: 'naughty-dog',       name: 'Naughty Dog',       logo: 'ND',  color: '#1A1A2E', slug: 'naughtydog' },
  // New studios
  { studioId: 'epic-games',        name: 'Epic Games',        logo: 'EG',  color: '#0078F2', slug: 'epicgames' },
  { studioId: 'rockstar-games',    name: 'Rockstar Games',    logo: 'RS',  color: '#FCAF17', slug: 'rockstargames' },
  { studioId: 'roblox',            name: 'Roblox',            logo: 'RBX', color: '#E2231A', slug: 'roblox' },
  { studioId: 'turtle-rock',       name: 'Turtle Rock Studios', logo: 'TR', color: '#2ECC71', slug: 'turtlerockstudios' },
  { studioId: 'housemarque',       name: 'Housemarque',       logo: 'HQ',  color: '#E74C3C', slug: 'housemarque' },
  { studioId: 'crystal-dynamics',  name: 'Crystal Dynamics',  logo: 'CD',  color: '#8E44AD', slug: 'crystaldynamics' },
]

function mapDiscipline(departments: Array<{ name: string }>): Discipline {
  const name = (departments[0]?.name ?? '').toLowerCase()
  if (name.includes('engineer') || name.includes('program') || name.includes('tech')) return 'Engineering'
  if (name.includes('art') || name.includes('vfx') || name.includes('visual') || name.includes('animat')) return 'Art & VFX'
  if (name.includes('audio') || name.includes('sound') || name.includes('music')) return 'Audio'
  if (name.includes('writ') || name.includes('narrat') || name.includes('content')) return 'Writing'
  if (name.includes('produc') || name.includes('qa') || name.includes('quality') || name.includes('operat')) return 'Production'
  if (name.includes('market') || name.includes('communit') || name.includes('social')) return 'Marketing'
  if (name.includes('data') || name.includes('analyt') || name.includes('insight')) return 'Analytics'
  if (name.includes('design')) return 'Game Design'
  return 'Game Design'
}

function mapExperienceLevel(title: string): ExperienceLevel {
  const t = title.toLowerCase()
  if (
    t.includes('lead') || t.includes('principal') || t.includes('director') ||
    t.includes('head of') || t.includes(' manager') || t.includes('vp ') || t.includes('staff ')
  ) return 'Lead'
  if (t.includes('senior') || t.includes('sr.') || t.includes(' sr ')) return 'Senior'
  if (t.includes('junior') || t.includes('jr.') || t.includes(' jr ') || t.includes('entry') || t.includes('associate')) return 'Junior'
  return 'Mid'
}

function isRemote(location: string): boolean {
  const l = location.toLowerCase()
  return l.includes('remote') || l.includes('anywhere') || l.includes('distributed')
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = {
    synced: 0,
    removed: 0,
    errors: [] as string[],
    studios: {} as Record<string, number>,
  }

  const allFetchedIds: string[] = []

  for (const studio of STUDIOS) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${studio.slug}/jobs?content=true`,
        { headers: { 'User-Agent': 'Loadout-JobSync/1.0' } }
      )

      if (!res.ok) {
        results.errors.push(`${studio.name}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()
      const jobs: Array<{
        id: number
        title: string
        location: { name: string }
        departments: Array<{ name: string }>
        content: string
        updated_at: string
        absolute_url: string
      }> = data.jobs ?? []

      let studioCount = 0

      for (const job of jobs) {
        const id = `gh-${job.id}`
        allFetchedIds.push(id)

        const postedAt = new Date(job.updated_at ?? Date.now())
        const isNew = Date.now() - postedAt.getTime() < 7 * 24 * 60 * 60 * 1000
        const remote = isRemote(job.location?.name ?? '')
        const tags: string[] = []
        if (isNew) tags.push('new')
        if (remote) tags.push('remote')

        const { error } = await supabase.from('jobs').upsert({
          id,
          studio_id: studio.studioId,
          title: job.title,
          company: studio.name,
          company_logo: studio.logo,
          company_color: studio.color,
          location: job.location?.name ?? 'Unknown',
          remote,
          discipline: mapDiscipline(job.departments ?? []),
          experience_level: mapExperienceLevel(job.title),
          salary_band: null,
          salary: null,
          tags,
          posted_at: job.updated_at ?? new Date().toISOString(),
          description: job.content ?? '',
          apply_url: job.absolute_url,
          source: 'greenhouse',
        }, { onConflict: 'id' })

        if (error) {
          results.errors.push(`${studio.name} / ${job.title}: ${error.message}`)
        } else {
          studioCount++
          results.synced++
        }
      }

      results.studios[studio.name] = studioCount

      // Small delay to be polite to the Greenhouse API
      await new Promise(r => setTimeout(r, 300))

    } catch (err) {
      results.errors.push(`${studio.name}: ${(err as Error).message}`)
    }
  }

  // Remove jobs that are no longer listed on Greenhouse (closed/filled)
  const { data: existingGHJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('source', 'greenhouse')

  if (existingGHJobs) {
    const staleIds = existingGHJobs
      .map((j: { id: string }) => j.id)
      .filter((id: string) => !allFetchedIds.includes(id))

    if (staleIds.length > 0) {
      await supabase.from('jobs').delete().in('id', staleIds)
      results.removed = staleIds.length
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
