import type { Discipline } from '../lib/types'

const disciplines: Array<{ label: string; value: Discipline | null; emoji: string }> = [
  { label: 'All Roles', value: null, emoji: '🎯' },
  { label: 'Game Design', value: 'Game Design', emoji: '🎮' },
  { label: 'Engineering', value: 'Engineering', emoji: '💻' },
  { label: 'Art & VFX', value: 'Art & VFX', emoji: '🎨' },
  { label: 'Marketing', value: 'Marketing', emoji: '📢' },
  { label: 'Audio', value: 'Audio', emoji: '🎵' },
  { label: 'Writing', value: 'Writing', emoji: '📝' },
  { label: 'Production', value: 'Production', emoji: '🎯' },
  { label: 'Analytics', value: 'Analytics', emoji: '📊' },
]

interface Props {
  active: Discipline | null
  onChange: (value: Discipline | null) => void
}

export default function DisciplineFilter({ active, onChange }: Props) {
  return (
    <div style={{
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <span style={{
        fontSize: 11,
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginRight: 4,
        flexShrink: 0,
      }}>
        Filter:
      </span>
      {disciplines.map(d => {
        const isActive = d.value === active
        return (
          <button
            key={d.label}
            onClick={() => onChange(d.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              border: `1px solid ${isActive ? 'var(--orange)' : 'var(--border2)'}`,
              background: isActive ? 'var(--accent-dim)' : 'var(--surface)',
              color: isActive ? 'var(--orange)' : 'var(--sub)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {d.emoji} {d.label}
          </button>
        )
      })}
    </div>
  )
}
