import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBreakpoint } from '../hooks/useBreakpoint'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/jobs', label: 'Jobs' },
  { to: '/studios', label: 'Studios' },
  { to: '/tutorials', label: 'Tutorials' },
  { to: '/articles', label: 'Articles' },
  { to: '/dev-logs', label: 'Dev Logs' },
  { to: '/guides', label: 'Guides' },
]

export default function Nav() {
  const { isMobile } = useBreakpoint()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const linkStyle = (isActive: boolean) => ({
    padding: '6px 14px',
    fontSize: 13,
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: isActive ? 'var(--text)' : 'var(--sub)',
    borderRadius: 6,
    textDecoration: 'none',
    transition: 'all 0.15s',
    borderBottom: isActive ? '2px solid var(--orange)' : '2px solid transparent',
    boxShadow: isActive ? '0 2px 8px rgba(255,92,0,0.4)' : 'none',
  })

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        borderLeft: '3px solid', borderImageSlice: 1,
        borderImageSource: 'linear-gradient(to bottom, var(--orange), transparent)',
        height: 56, display: 'flex', alignItems: 'center',
        paddingInline: 24, gap: 0,
      }}>
        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text)', marginRight: 32, flexShrink: 0 }}>
          LOAD<span style={{ color: 'var(--orange)' }}>OUT</span>
        </div>

        {isMobile ? (
          <>
            <div style={{ flex: 1 }} />
            {/* Hamburger */}
            <button
              onClick={() => setOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}
              aria-label="Menu"
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={open
                    ? i === 0 ? { rotate: 45, y: 7 } : i === 1 ? { opacity: 0 } : { rotate: -45, y: -7 }
                    : { rotate: 0, y: 0, opacity: 1 }
                  }
                  style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2, transformOrigin: 'center' }}
                />
              ))}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {links.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} style={({ isActive }) => linkStyle(isActive)}>
                  {label}
                </NavLink>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={() => navigate('/for-studios')} style={{ padding: '7px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
              <button onClick={() => navigate('/jobs')} style={{ padding: '7px 18px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)', boxShadow: '0 0 20px rgba(255,92,0,0.35)', cursor: 'pointer' }}>
                Find Work ▶
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobile && open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
              background: 'rgba(8,8,16,0.98)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)',
              padding: '16px 24px 24px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to} to={to} end={end}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  ...linkStyle(isActive),
                  padding: '10px 14px',
                  fontSize: 15,
                  borderBottom: 'none',
                  borderLeft: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                })}
              >
                {label}
              </NavLink>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { navigate('/for-studios'); setOpen(false) }} style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
              <button onClick={() => { navigate('/jobs'); setOpen(false) }} style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                Find Work ▶
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
