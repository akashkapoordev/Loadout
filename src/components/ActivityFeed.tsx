import { useActivity } from '../hooks/useActivity'

const dotColors: Record<string, string> = {
  orange: 'var(--orange)',
  cyan: 'var(--cyan)',
  green: 'var(--green)',
}

export default function ActivityFeed() {
  const { data } = useActivity()
  const items = data?.data ?? []

  return (
    <>
    <style>{`
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div key={item.id} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '10px 0',
          borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColors[item.color],
            boxShadow: `0 0 6px ${dotColors[item.color]}`,
            flexShrink: 0,
            marginTop: 5,
            animation: 'blink 2s ease-in-out infinite',
            animationDelay: `${i * 0.3}s`,
          }} />
          <span style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{item.highlight}</strong>
            {' '}{item.message.replace(item.highlight, '').trim()}
          </span>
        </div>
      ))}
    </div>
    </>
  )
}
