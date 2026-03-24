# For Studios — Coming Soon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/for-studios` Coming Soon page with an email waitlist signup, and wire all dead "Post a Job" / "Studio Profile" / "Pricing" links across the site to point to it.

**Architecture:** A single new page component (`ForStudiosPage.tsx`) handles the UI and Supabase insert inline. No new hooks or API functions needed — the existing `supabase` client handles the one-field insert directly. Four existing files are updated to replace dead `#` links and `/jobs` nav targets with `/for-studios`.

**Tech Stack:** React 18, TypeScript, React Router v7, Supabase JS client (already configured at `src/lib/supabase.ts`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/ForStudiosPage.tsx` | **Create** | Coming Soon page — hero, 3 feature cards, email form, all UI states |
| `src/App.tsx` | **Modify** | Add `/for-studios` route |
| `src/components/Nav.tsx` | **Modify** | Update "Post a Job" button in desktop layout (line 83) and mobile drawer (line 128) |
| `src/components/Footer.tsx` | **Modify** | Update 3 `#` links to `/for-studios` |
| `src/pages/HomePage.tsx` | **Modify** | Update `CalloutCard` onClick to navigate `/for-studios` |

---

## Task 1: Create Supabase Table

This is a manual step in the Supabase dashboard — no code changes.

- [ ] **Step 1: Open the Supabase SQL Editor**

  Go to your Supabase project dashboard → SQL Editor → New Query.

- [ ] **Step 2: Run the table + RLS SQL**

```sql
create table studio_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table studio_waitlist enable row level security;

create policy "allow_anon_insert"
  on studio_waitlist
  for insert
  to anon
  with check (true);
```

- [ ] **Step 3: Verify**

  In Table Editor, confirm `studio_waitlist` exists with columns: `id`, `email`, `created_at`.

---

## Task 2: Create ForStudiosPage

**Files:**
- Create: `src/pages/ForStudiosPage.tsx`

- [ ] **Step 1: Create the page component**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 3: Add Route in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import and route**

In `src/App.tsx`, add the import after existing page imports:

```tsx
import ForStudiosPage from './pages/ForStudiosPage'
```

Add the route inside `<Route element={<Layout />}>`, after the guides routes:

```tsx
<Route path="/for-studios" element={<ForStudiosPage />} />
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForStudiosPage.tsx src/App.tsx
git commit -m "feat: add /for-studios coming soon page with email waitlist"
```

---

## Task 4: Update Nav.tsx

**Files:**
- Modify: `src/components/Nav.tsx`

- [ ] **Step 1: Update desktop "Post a Job" button (line 83)**

Find this exact text:
```tsx
<button onClick={() => navigate('/jobs')} style={{ padding: '7px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
```

Change only the `onClick` — replace `navigate('/jobs')` with `navigate('/for-studios')`:
```tsx
<button onClick={() => navigate('/for-studios')} style={{ padding: '7px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
```

- [ ] **Step 2: Update mobile drawer "Post a Job" button (line 128)**

Find this exact text:
```tsx
<button onClick={() => { navigate('/jobs'); setOpen(false) }} style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
```

Change only the `onClick` — replace `navigate('/jobs')` with `navigate('/for-studios')`:
```tsx
<button onClick={() => { navigate('/for-studios'); setOpen(false) }} style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
                Post a Job
              </button>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "fix: wire nav Post a Job buttons to /for-studios"
```

---

## Task 5: Update Footer.tsx

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Update the three For Studios links**

In `src/components/Footer.tsx`, find the `For Studios` column (around line 52–57):

```tsx
{
  title: 'For Studios',
  links: [
    { to: '#', label: 'Post a Job' },
    { to: '#', label: 'Studio Profile' },
    { to: '#', label: 'Pricing' },
  ],
},
```

Change all three `to: '#'` to `to: '/for-studios'`:

```tsx
{
  title: 'For Studios',
  links: [
    { to: '/for-studios', label: 'Post a Job' },
    { to: '/for-studios', label: 'Studio Profile' },
    { to: '/for-studios', label: 'Pricing' },
  ],
},
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "fix: wire footer For Studios links to /for-studios"
```

---

## Task 6: Update HomePage.tsx

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Update CalloutCard onClick**

Find the `CalloutCard` near line 216–222:

```tsx
<CalloutCard
  icon="🏢"
  title="Hiring Game Talent?"
  description="Post your open roles on Loadout and reach thousands of gaming professionals actively looking for work."
  buttonLabel="Post a Job →"
  onClick={() => navigate('/jobs')}
/>
```

Change `onClick`:

```tsx
<CalloutCard
  icon="🏢"
  title="Hiring Game Talent?"
  description="Post your open roles on Loadout and reach thousands of gaming professionals actively looking for work."
  buttonLabel="Post a Job →"
  onClick={() => navigate('/for-studios')}
/>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "fix: wire homepage CalloutCard to /for-studios"
```

---

## Task 7: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify all entry points reach /for-studios**

Check each of these navigates to the Coming Soon page (not `/jobs` or `#`):
- Desktop nav "Post a Job" button
- Mobile nav hamburger → "Post a Job" button
- Footer "Post a Job" link
- Footer "Studio Profile" link
- Footer "Pricing" link
- Homepage "Hiring Game Talent?" → "Post a Job →" button

- [ ] **Step 3: Test the email form**

1. Submit with empty field → should show "Please enter a valid email address." without network request
2. Submit with invalid format (e.g. `notanemail`) → should show validation error
3. Submit with valid email → button shows "Submitting…" → then "You're on the list!"
4. Submit same email again → should show "You're already on the list!"
5. Verify email appears in Supabase Table Editor under `studio_waitlist`

- [ ] **Step 4: Verify mobile layout**

At mobile viewport, confirm:
- Feature cards stack to single column
- Email form stacks input above button
- Page padding is 20px inline
