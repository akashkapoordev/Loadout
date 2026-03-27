import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

const benefits = [
  { icon: '✕', label: 'Ad-free reading', desc: 'No ads on any content page.' },
  { icon: '★', label: 'Premium guides & devlogs', desc: 'Access exclusive content not available to free users.' },
  { icon: '♥', label: 'Support independent coverage', desc: 'Help fund game dev journalism and tutorials.' },
]

export default function PremiumPage() {
  const { user, isPremium, openCheckoutOrAuth } = useAuth()
  const { isMobile } = useBreakpoint()

  useEffect(() => { document.title = 'Premium — Loadout' }, [])

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: isMobile ? 32 : 60, paddingBottom: 80, maxWidth: 640, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 16 }}>
          Premium
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 36 : 52, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>
          LOADOUT<br /><span style={{ color: 'var(--orange)' }}>PREMIUM</span>
        </h1>
        <div style={{ fontSize: isMobile ? 32 : 40, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
          $7<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>/month</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.6 }}>
          Support independent game dev coverage and unlock everything on Loadout.
        </p>
      </div>

      {/* Benefits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {benefits.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
            <div style={{ fontSize: 18, color: 'var(--orange)', flexShrink: 0, marginTop: 1 }}>{b.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{b.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {isPremium ? (
        <div style={{ textAlign: 'center', padding: '24px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--orange)', marginBottom: 6 }}>★ You're a Premium Member</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Thank you for supporting Loadout.</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={openCheckoutOrAuth}
            style={{
              padding: '14px 48px',
              fontSize: 15,
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              background: 'var(--orange)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(255,92,0,0.4)',
            }}
          >
            {user ? 'Get Started — $7/month' : 'Sign Up & Get Started'}
          </button>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
            Cancel anytime. Billed monthly via Stripe.
          </div>
        </div>
      )}
    </div>
  )
}
