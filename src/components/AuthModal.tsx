import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Tab = 'signin' | 'signup'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          setError(err.message.includes('Invalid') ? 'Incorrect email or password.' : 'Something went wrong. Please try again.')
        } else {
          onClose()
        }
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) {
          setError(err.message.includes('already') ? 'An account with that email already exists.' : 'Something went wrong. Please try again.')
        } else {
          onClose()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px 0',
    fontSize: 13,
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--orange)' : 'var(--border)'}`,
    color: active ? 'var(--text)' : 'var(--muted)',
    cursor: 'pointer',
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 32,
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            LOAD<span style={{ color: 'var(--orange)' }}>OUT</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {tab === 'signin' ? 'Sign in to your account' : 'Create a free account'}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24 }}>
          <button style={tabStyle(tab === 'signin')} onClick={() => { setTab('signin'); setError('') }}>Sign In</button>
          <button style={tabStyle(tab === 'signup')} onClick={() => { setTab('signup'); setError('') }}>Sign Up</button>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              fontFamily: 'var(--font-ui)',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              borderRadius: 8,
              marginBottom: 10,
              boxSizing: 'border-box' as const,
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              fontFamily: 'var(--font-ui)',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              borderRadius: 8,
              marginBottom: error ? 8 : 16,
              boxSizing: 'border-box' as const,
              outline: 'none',
            }}
          />
          {error && (
            <div role="alert" style={{ fontSize: 12, color: 'var(--orange)', marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 0',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              background: 'var(--orange)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 16px rgba(255,92,0,0.3)',
            }}
          >
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </>
  )
}
