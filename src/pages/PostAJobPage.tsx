import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useBreakpoint } from '../hooks/useBreakpoint'

type Tier = 'standard' | 'featured'

const DISCIPLINES = ['Game Design', 'Engineering', 'Art & VFX', 'Marketing', 'Audio', 'Writing', 'Production', 'Analytics']
const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead']
const SALARY_BANDS = ['<$60k', '$60-100k', '$100-150k', '$150k+']

const tiers: { id: Tier; name: string; price: number; perks: string[] }[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 99,
    perks: ['Listed for 30 days', 'Appears in job feed & search', 'All discipline filters'],
  },
  {
    id: 'featured',
    name: 'Featured',
    price: 199,
    perks: ['Listed for 30 days', 'Pinned to top of feed', 'Orange "Featured" badge', 'Highlighted card'],
  },
]

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: 'var(--font-ui)',
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontFamily: 'var(--font-ui)',
  fontWeight: 700,
  color: 'var(--sub)',
  marginBottom: 6,
  letterSpacing: '0.3px',
}

export default function PostAJobPage() {
  const { isMobile } = useBreakpoint()
  const [tier, setTier] = useState<Tier>('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    remote: false,
    discipline: 'Engineering',
    experienceLevel: 'Mid',
    salaryBand: '',
    salary: '',
    description: '',
    applyUrl: '',
    contactEmail: '',
  })

  useEffect(() => { document.title = 'Post a Job — Loadout' }, [])

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-job-posting-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            jobData: {
              ...form,
              salaryBand: form.salaryBand || undefined,
              salary: form.salary || undefined,
            },
            tier,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Something went wrong.')
      window.location.href = json.url
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 32, paddingBottom: 80, maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 12 }}>
          Hiring
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 32 : 44, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 10 }}>
          POST A JOB
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Reach thousands of game developers, artists, designers, and producers actively looking for work.
        </p>
      </div>

      {/* Tier selection */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--sub)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Choose a plan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          {tiers.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              style={{
                textAlign: 'left',
                padding: '20px 22px',
                borderRadius: 12,
                border: `2px solid ${tier === t.id ? 'var(--orange)' : 'var(--border)'}`,
                background: tier === t.id ? 'var(--accent-dim)' : 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontFamily: 'var(--font-ui)', fontWeight: 700, color: tier === t.id ? 'var(--orange)' : 'var(--text)' }}>
                  {t.name}
                </span>
                <span style={{ fontSize: 20, fontWeight: 900, color: tier === t.id ? 'var(--orange)' : 'var(--text)' }}>
                  ${t.price}
                </span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.perks.map(p => (
                  <li key={p} style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--orange)', fontWeight: 700 }}>✓</span> {p}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Job title + Company */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Job Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Game Designer" required />
            </div>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Indie Studio Ltd." required />
            </div>
          </div>

          {/* Location + Remote */}
          <div>
            <label style={labelStyle}>Location *</label>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. London, UK or Remote" required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.remote} onChange={e => set('remote', e.target.checked)} style={{ accentColor: 'var(--orange)', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'var(--sub)' }}>This is a remote role</span>
            </label>
          </div>

          {/* Discipline + Level */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Discipline *</label>
              <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.discipline} onChange={e => set('discipline', e.target.value)}>
                {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Experience Level *</label>
              <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Salary band + Salary (optional) */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Salary Range <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.salaryBand} onChange={e => set('salaryBand', e.target.value)}>
                <option value="">Not specified</option>
                {SALARY_BANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Salary Display <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <input style={inputStyle} value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. $80,000–$100,000" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Job Description * <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(HTML supported)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="<p>About the role...</p><h3>Requirements</h3><ul><li>...</li></ul>"
              required
            />
          </div>

          {/* Apply URL */}
          <div>
            <label style={labelStyle}>Apply URL *</label>
            <input style={inputStyle} type="url" value={form.applyUrl} onChange={e => set('applyUrl', e.target.value)} placeholder="https://yourcompany.com/careers/role" required />
          </div>

          {/* Contact email */}
          <div>
            <label style={labelStyle}>Contact Email * <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(not shown publicly — for receipt only)</span></label>
            <input style={inputStyle} type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="hiring@yourcompany.com" required />
          </div>

          {error && (
            <div role="alert" style={{ fontSize: 13, color: 'var(--orange)', padding: '10px 14px', border: '1px solid rgba(255,92,0,0.3)', borderRadius: 8, background: 'var(--accent-dim)' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 0',
              fontSize: 15,
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              background: 'var(--orange)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 24px rgba(255,92,0,0.3)',
            }}
          >
            {loading ? 'Redirecting to payment…' : `Pay $${tier === 'featured' ? 199 : 99} & Post Job`}
          </button>

          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: -8 }}>
            Secure payment via Stripe. Job goes live immediately after payment.
          </p>
        </div>
      </form>
    </div>
  )
}
