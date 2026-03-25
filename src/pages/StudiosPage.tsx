import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStudios } from '../hooks/useStudios'
import { useJobStudioCounts } from '../hooks/useJobs'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function StudiosPage() {
  useEffect(() => { document.title = 'Studios — Loadout' }, [])

  const { data, isLoading, isError } = useStudios()
  const studios = data?.data ?? []

  const { data: rolesByStudio = {} } = useJobStudioCounts()

  const { isMobile } = useBreakpoint()
  const [search, setSearch] = useState('')

  // Resolve role count using studio ID first, then normalised company name
  const studioRoles = (id: string, name: string) =>
    (rolesByStudio[id] ?? 0) || (rolesByStudio[name.toLowerCase().trim()] ?? 0)

  const filtered = studios
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => studioRoles(b.id, b.name) - studioRoles(a.id, a.name))

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: isMobile ? 20 : 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
          STUDIOS
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>{studios.length} studios on Loadout</p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : isError ? (
        <div style={{ padding: 40, color: 'var(--muted)' }}>Failed to load studios. Please try again.</div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search studios…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 320, padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-ui)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 6, outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(studio => {
              const roles = studioRoles(studio.id, studio.name)
              const hasRoles = roles > 0
              return (
                <Link
                  key={studio.id}
                  to={`/studios/${studio.id}`}
                  style={{ textDecoration: 'none', opacity: hasRoles ? 1 : 0.55 }}
                >
                  <div style={{
                    border: `1px solid ${hasRoles ? 'var(--border2)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: 20,
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 10,
                        background: studio.logoBg, border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 900,
                        color: studio.logoColor, flexShrink: 0,
                      }}>
                        {studio.logoInitials}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{studio.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>📍 {studio.location}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.5, marginBottom: 16 }}>
                      {studio.description.slice(0, 120)}…
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {studio.disciplines.slice(0, 3).map(d => (
                          <span key={d} style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, padding: '2px 8px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--muted)' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ fontSize: 11, color: hasRoles ? 'var(--orange)' : 'var(--muted)', fontWeight: hasRoles ? 700 : 400 }}>
                          {roles} open role{roles !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>View studio →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
