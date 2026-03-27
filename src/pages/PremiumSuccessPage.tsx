import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PremiumSuccessPage() {
  const { isPremium, isSubscriptionLoading, refreshSubscription } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    document.title = 'Welcome to Premium — Loadout'
    refreshSubscription()

    // If subscription hasn't activated after 10s, show fallback message
    const timer = setTimeout(() => setTimedOut(true), 10000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ paddingInline: 40, paddingTop: 80, paddingBottom: 80, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      {isSubscriptionLoading ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Activating your membership…</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>This will only take a moment.</div>
        </>
      ) : isPremium ? (
        <>
          <div style={{ fontSize: 48, color: 'var(--orange)', marginBottom: 16 }}>★</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 12 }}>
            YOU'RE PREMIUM
          </h1>
          <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 32 }}>
            Welcome to Loadout Premium. You now have ad-free reading and access to all premium content.
          </p>
          <Link
            to="/tutorials"
            style={{ padding: '12px 32px', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', borderRadius: 8, textDecoration: 'none', boxShadow: '0 0 20px rgba(255,92,0,0.35)' }}
          >
            Start Reading →
          </Link>
        </>
      ) : timedOut ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Payment received!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
            It may take a moment to activate. Please refresh the page in a few seconds.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 28px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </>
      ) : (
        // Initial state before refreshSubscription resolves
        <>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
        </>
      )}
    </div>
  )
}
