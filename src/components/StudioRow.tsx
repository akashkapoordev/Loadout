import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Studio } from '../lib/types'

interface Props {
  studio: Studio & { openRoles?: number }
}

export default function StudioRow({ studio }: Props) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/studios/${studio.id}`)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/studios/${studio.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 7,
        background: studio.logoBg,
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        color: studio.logoColor,
        flexShrink: 0,
      }}>
        {studio.logoInitials}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: hovered ? 'var(--orange)' : 'var(--text)',
          marginBottom: 1,
          transition: 'color 0.15s',
        }}>
          {studio.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          {studio.openRoles ?? 0} open role{(studio.openRoles ?? 0) !== 1 ? 's' : ''}
        </div>
      </div>

      <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
    </div>
  )
}
