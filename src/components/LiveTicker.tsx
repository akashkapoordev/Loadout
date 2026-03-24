import { useActivity } from '../hooks/useActivity'

const staticItems = [
  { id: 's1', highlight: 'Riot Games', message: 'posted 4 new roles · Design, Engineering' },
  { id: 's2', highlight: '477 new listings', message: 'this week — up 12% from last week' },
  { id: 's3', highlight: 'CD Projekt Red', message: 'is hiring a Senior Narrative Designer' },
  { id: 's4', highlight: 'Indie Showcase', message: '— 14 new studios joined Loadout this month' },
]

export default function LiveTicker() {
  const { data } = useActivity()
  const items = data?.data.slice(0, 4) ?? staticItems

  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      height: 36,
      display: 'flex',
      alignItems: 'center',
      paddingInline: 24,
      gap: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--orange)',
        color: '#fff',
        fontSize: 10,
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 3,
        flexShrink: 0,
      }}>
        Live
      </div>

      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex',
          gap: 40,
          animation: 'ticker 30s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: 'var(--sub)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{item.highlight}</strong>
              {' '}{item.message}
              <span style={{ color: 'var(--border2)', fontSize: 16, marginLeft: 20 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
