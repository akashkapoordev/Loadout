import { Link } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function Footer() {
  const { isMobile, isTablet } = useBreakpoint()
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg2)',
      padding: '40px 40px 24px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '200px 1fr 1fr 1fr',
        gap: 32,
        marginBottom: 24,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: 10,
          }}>
            LOAD<span style={{ color: 'var(--orange)' }}>OUT</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            The professional platform for the gaming industry. Level up your career.
          </p>
        </div>

        {[
          {
            title: 'Find Work',
            links: [
              { to: '/jobs', label: 'Browse Jobs' },
              { to: '/studios', label: 'Studios' },
              { to: '/jobs?remote=true', label: 'Remote Roles' },
            ],
          },
          {
            title: 'Learn',
            links: [
              { to: '/tutorials', label: 'Tutorials' },
              { to: '/articles', label: 'Articles' },
              { to: '/dev-logs', label: 'Dev Logs' },
              { to: '/guides', label: 'Guides' },
            ],
          },
          {
            title: 'For Studios',
            links: [
              { to: '/for-studios', label: 'Post a Job' },
              { to: '/for-studios', label: 'Studio Profile' },
              { to: '/for-studios', label: 'Pricing' },
            ],
          },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{
              fontSize: 11,
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--sub)',
              marginBottom: 12,
            }}>
              {col.title}
            </h4>
            {col.links.map(link => (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginBottom: 8,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          © 2026 Loadout. All rights reserved.
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Level Up Your Career In Gaming
        </span>
      </div>
    </footer>
  )
}
