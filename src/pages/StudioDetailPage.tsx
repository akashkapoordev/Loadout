import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useStudio, useStudioJobs } from '../hooks/useStudios'
import JobCard from '../components/JobCard'
import PageHeader from '../components/PageHeader'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function StudioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: studioData, isLoading, isError } = useStudio(id!)
  const { data: jobsData } = useStudioJobs(id!)

  const studio = studioData?.data
  const jobs = jobsData?.data ?? []
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (studio) document.title = `${studio.name} — Loadout`
  }, [studio])

  if (isLoading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>
  if (isError || !studio) return <div style={{ padding: 40, color: 'var(--muted)' }}>Studio not found.</div>

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 32, paddingBottom: 60 }}>
      <Link to="/studios" style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to Studios</Link>

      {/* Studio header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, background: studio.logoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 900, color: studio.logoColor, flexShrink: 0 }}>
          {studio.logoInitials}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 6 }}>{studio.name}</h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--sub)', marginBottom: 12 }}>
            <span>📍 {studio.location}</span>
            {studio.founded && <span>Est. {studio.founded}</span>}
            {studio.website && <a href={studio.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Website ↗</a>}
            {studio.twitter && <a href={`https://twitter.com/${studio.twitter}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Twitter ↗</a>}
            {studio.linkedin && <a href={studio.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>LinkedIn ↗</a>}
          </div>
          <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.6, maxWidth: 600 }}>{studio.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
        {[
          { val: jobs.length, label: 'Open Roles' },
          ...(studio.founded ? [{ val: studio.founded, label: 'Founded' }] : []),
          { val: studio.disciplines.length, label: 'Disciplines' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--orange)', letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-col: jobs + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 40 }}>
        <div>
          <PageHeader title={`Open Roles at ${studio.name}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {jobs.map(j => <JobCard key={j.id} job={j} />)}
            {jobs.length === 0 && <div style={{ color: 'var(--muted)', padding: '20px 0' }}>No open roles right now.</div>}
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 16 }}>Hires For</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {studio.disciplines.map(d => (
                  <span key={d} style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--sub)' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
