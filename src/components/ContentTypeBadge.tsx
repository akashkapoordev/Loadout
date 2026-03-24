import type { ContentType } from '../lib/types'

const config: Record<ContentType, { label: string; color: string; bg: string; border: string }> = {
  tutorial: { label: 'Tutorial', color: 'var(--cyan)', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)' },
  article:  { label: 'Article',  color: 'var(--green)', bg: 'rgba(57,255,131,0.1)', border: 'rgba(57,255,131,0.3)' },
  devlog:   { label: 'Dev Log',  color: 'var(--purple)', bg: 'rgba(157,96,255,0.1)', border: 'rgba(157,96,255,0.3)' },
  guide:    { label: 'Guide',    color: 'var(--amber)', bg: 'rgba(255,184,48,0.1)', border: 'rgba(255,184,48,0.3)' },
}

interface Props {
  type: ContentType
  size?: 'sm' | 'md'
}

export default function ContentTypeBadge({ type, size = 'sm' }: Props) {
  const c = config[type]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      fontSize: size === 'sm' ? 10 : 12,
      fontFamily: 'var(--font-ui)',
      fontWeight: 700,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 4,
    }}>
      {c.label}
    </span>
  )
}
