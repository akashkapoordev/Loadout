import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function PostAJobSuccessPage() {
  const { isMobile } = useBreakpoint()

  useEffect(() => { document.title = 'Job Posted — Loadout' }, [])

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: isMobile ? 48 : 80, paddingBottom: 80, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>

      <div style={{ fontSize: 48, marginBottom: 24 }}>🎮</div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 32 : 44, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 14 }}>
        YOUR JOB IS <span style={{ color: 'var(--orange)' }}>LIVE</span>
      </h1>

      <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 40 }}>
        Payment confirmed. Your listing is now visible to thousands of game developers on Loadout.
        It will remain active for <strong style={{ color: 'var(--text)' }}>30 days</strong>.
      </p>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, justifyContent: 'center' }}>
        <Link
          to="/jobs"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            background: 'var(--orange)',
            color: '#fff',
            borderRadius: 9,
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(255,92,0,0.3)',
          }}
        >
          View Jobs Board
        </Link>
        <Link
          to="/post-a-job"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            background: 'var(--surface)',
            color: 'var(--sub)',
            border: '1px solid var(--border2)',
            borderRadius: 9,
            textDecoration: 'none',
          }}
        >
          Post Another Job
        </Link>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 32 }}>
        A receipt has been sent to your email. Questions? Reach us at{' '}
        <a href="mailto:hello@builtloadout.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>hello@builtloadout.com</a>
      </p>
    </div>
  )
}
