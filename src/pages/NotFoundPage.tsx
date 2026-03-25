import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function NotFoundPage() {
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    document.title = '404 Not Found — Loadout'
  }, [])

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
      <div style={{ fontSize: 72, fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--border)', letterSpacing: '-2px', marginBottom: 8 }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 12 }}>
        PAGE NOT FOUND
      </h1>
      <p style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 32 }}>
        That page doesn't exist. Maybe it moved, or the URL is wrong.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700,
          background: 'var(--orange)', color: '#fff', textDecoration: 'none',
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
        }}
      >
        ← Back to Home
      </Link>
    </div>
  )
}
