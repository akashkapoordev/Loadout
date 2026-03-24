import { Link } from 'react-router-dom'
import { useStudios } from '../hooks/useStudios'

export default function StudiosPage() {
  const { data, isLoading } = useStudios()
  const studios = data?.data ?? []

  return (
    <div style={{ paddingInline: 40, paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
          STUDIOS
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>{studios.length} studios on Loadout</p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {studios.map(studio => (
            <Link
              key={studio.id}
              to={`/studios/${studio.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                border: '1px solid var(--border)',
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
                  <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>View roles →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
