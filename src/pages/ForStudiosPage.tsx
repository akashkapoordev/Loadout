import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useBreakpoint } from '../hooks/useBreakpoint'

type FormState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

const features = [
  {
    icon: '📋',
    title: 'Post a Job',
    description: 'Reach thousands of gaming professionals actively looking for their next role.',
  },
  {
    icon: '🏢',
    title: 'Studio Profile',
    description: 'Showcase your studio, culture, and open roles in one place.',
  },
  {
    icon: '💳',
    title: 'Pricing',
    description: 'Simple, transparent plans for studios of every size.',
  },
]

export default function ForStudiosPage() {
  const { isMobile } = useBreakpoint()
  const [email, setEmail] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    document.title = 'For Studios — Loadout'
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setValidationError('Please enter a valid email address.')
      return
    }
    setValidationError('')
    setFormState('submitting')

    const { error } = await supabase.from('studio_waitlist').insert({ email: trimmed })

    if (!error) {
      setFormState('success')
    } else if (error.code === '23505') {
      setFormState('duplicate')
    } else {
      setFormState('error')
    }
  }

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: isMobile ? 32 : 60, paddingBottom: 80, maxWidth: 720, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 16 }}>
          Coming Soon
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 36 : 52, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>
          TOOLS FOR<br /><span style={{ color: 'var(--orange)' }}>STUDIOS</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          We're building tools for studios to post jobs, manage profiles, and more. Be the first to know when we launch.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 56 }}>
        {features.map(f => (
          <div key={f.title} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>{f.description}</div>
          </div>
        ))}
      </div>

      {/* Email form */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? 24 : 32, background: 'var(--surface)', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Get Notified at Launch</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Drop your email and we'll let you know when studio tools go live.</p>

        {formState === 'success' ? (
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)', padding: '12px 0' }}>
            ✓ You're on the list! We'll notify you when we launch.
          </div>
        ) : formState === 'duplicate' ? (
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)', padding: '12px 0' }}>
            ✓ You're already on the list!
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
              <input
                type="email"
                placeholder="studio@yourgame.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setValidationError(''); if (formState === 'error') setFormState('idle') }}
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 14,
                  fontFamily: 'var(--font-ui)', background: 'var(--bg)',
                  color: 'var(--text)', border: `1px solid ${validationError ? 'var(--orange)' : 'var(--border2)'}`,
                  borderRadius: 8, outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={formState === 'submitting'}
                style={{
                  padding: '10px 24px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700,
                  background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8,
                  cursor: formState === 'submitting' ? 'not-allowed' : 'pointer',
                  opacity: formState === 'submitting' ? 0.7 : 1,
                  boxShadow: '0 0 16px rgba(255,92,0,0.3)', whiteSpace: 'nowrap',
                }}
              >
                {formState === 'submitting' ? 'Submitting…' : 'Notify Me'}
              </button>
            </div>
            {validationError && (
              <div style={{ fontSize: 12, color: 'var(--orange)', marginTop: 8, textAlign: 'left' }}>{validationError}</div>
            )}
            {formState === 'error' && (
              <div style={{ fontSize: 12, color: 'var(--orange)', marginTop: 8 }}>Something went wrong. Please try again.</div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
