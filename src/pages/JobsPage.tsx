import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useJobsInfinite } from '../hooks/useJobs'
import JobCard from '../components/JobCard'
import { useBreakpoint } from '../hooks/useBreakpoint'
import type { Discipline, ExperienceLevel, SalaryBand } from '../lib/types'

const allDisciplines: Discipline[] = ['Game Design', 'Engineering', 'Art & VFX', 'Marketing', 'Audio', 'Writing', 'Production', 'Analytics']
const levels: ExperienceLevel[] = ['Junior', 'Mid', 'Senior', 'Lead']
const salaryBands: SalaryBand[] = ['<$60k', '$60-100k', '$100-150k', '$150k+']

export default function JobsPage() {
  useEffect(() => { document.title = 'Jobs — Loadout' }, [])

  const [params, setParams] = useSearchParams()

  const disciplinesParam = params.get('disciplines') ?? ''
  const disciplines = disciplinesParam ? disciplinesParam.split(',') as Discipline[] : []
  const remote = params.get('remote') === 'true' ? true : undefined
  const experienceLevel = params.get('experienceLevel') as ExperienceLevel | null
  const salaryBand = params.get('salaryBand') as SalaryBand | null
  const locationParam = params.get('location') ?? ''
  const [locationInput, setLocationInput] = useState(locationParam)

  useEffect(() => { setLocationInput(locationParam) }, [locationParam])

  function set(key: string, value: string | null) {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  function clearAll() {
    setParams({}, { replace: true })
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useJobsInfinite({
    disciplines: disciplines.length ? disciplines : undefined,
    remote,
    experienceLevel: experienceLevel ?? undefined,
    salaryBand: salaryBand ?? undefined,
    location: locationParam || undefined,
  })

  const jobs = data?.pages.flatMap(p => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0
  const hasFilters = disciplines.length > 0 || remote || experienceLevel || salaryBand || locationParam
  const { isMobile } = useBreakpoint()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const checkboxStyle = { accentColor: 'var(--orange)', cursor: 'pointer' }

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 32 : 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
            OPEN ROLES
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{total} positions available</p>
        </div>
        {isMobile && (
          <button
            onClick={() => setFiltersOpen(o => !o)}
            style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, background: hasFilters ? 'var(--accent-dim)' : 'var(--surface)', color: hasFilters ? 'var(--orange)' : 'var(--sub)', border: `1px solid ${hasFilters ? 'var(--orange)' : 'var(--border2)'}`, borderRadius: 7, cursor: 'pointer' }}
          >
            Filters {hasFilters ? '●' : ''}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: 40 }}>

        {/* Filters sidebar */}
        {(!isMobile || filtersOpen) && <div>
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Discipline */}
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 12 }}>Discipline</div>
              {allDisciplines.map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={disciplines.includes(d)}
                    onChange={e => {
                      const next = e.target.checked ? [...disciplines, d] : disciplines.filter(x => x !== d)
                      set('disciplines', next.length ? next.join(',') : null)
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--sub)' }}>{d}</span>
                </label>
              ))}
            </div>

            {/* Location */}
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 12 }}>Location</div>
              <input
                type="text"
                placeholder="City, country…"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onBlur={() => set('location', locationInput || null)}
                onKeyDown={e => e.key === 'Enter' && set('location', locationInput || null)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'var(--font-ui)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                <input type="checkbox" style={checkboxStyle} checked={remote === true} onChange={e => set('remote', e.target.checked ? 'true' : null)} />
                <span style={{ fontSize: 13, color: 'var(--sub)' }}>Remote Only</span>
              </label>
            </div>

            {/* Salary */}
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 12 }}>Salary Range</div>
              {salaryBands.map(band => (
                <label key={band} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={checkboxStyle} checked={salaryBand === band} onChange={e => set('salaryBand', e.target.checked ? band : null)} />
                  <span style={{ fontSize: 13, color: 'var(--sub)' }}>{band}</span>
                </label>
              ))}
            </div>

            {/* Experience */}
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 12 }}>Experience</div>
              {levels.map(lvl => (
                <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={checkboxStyle} checked={experienceLevel === lvl} onChange={e => set('experienceLevel', e.target.checked ? lvl : null)} />
                  <span style={{ fontSize: 13, color: 'var(--sub)' }}>{lvl}</span>
                </label>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={clearAll}
                style={{ fontSize: 12, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>}

        {/* Job list */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {isError ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Failed to load jobs. Please try again.</div>
            ) : !data && isLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading jobs…</div>
            ) : (
              <>
                {jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
                {jobs.length === 0 && (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>No roles match your filters.</div>
                )}
              </>
            )}
          </div>

          {hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={{ padding: '10px 32px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--surface)', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer' }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
