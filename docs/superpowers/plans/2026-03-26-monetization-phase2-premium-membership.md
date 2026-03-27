# Monetization Phase 2: Premium Membership — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (email + Google OAuth), a $7/month Stripe subscription, ad-free reading for premium users, and premium content gating — building on top of the existing content system with no breaking changes for free users.

**Architecture:** `AuthContext` manages all auth + subscription state globally. A `public_content_items` Postgres view masks `body` for non-premium users. Stripe Checkout is handled server-side via two Supabase Edge Functions. The frontend redirects to Stripe-hosted checkout — no Stripe JS SDK on the frontend.

**Tech Stack:** React 19, TypeScript, Vite 8, `@supabase/supabase-js` v2 (already installed), Supabase Auth, Supabase Edge Functions (Deno), Stripe API. No new npm packages needed for the frontend.

**Prerequisites:** Phase 1 plan must be deployed first (adds `CarbonAd` component that Phase 2 extends with `hidden` prop).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/001_premium.sql` | Create | `is_premium` column, `subscriptions` table, `public.user_is_premium()`, `public_content_items` view |
| `src/lib/types.ts` | Modify | `body: string → string \| null`; add `bodyTeaser?`, `isPremium?` to `ContentItem` |
| `src/lib/api.ts` | Modify | All content queries → `public_content_items`; refactor `fetchContentItem`; update `mapContent` |
| `src/context/AuthContext.tsx` | Create | Auth state, subscription state, `openCheckout`, `openCheckoutOrAuth`, `refreshSubscription` |
| `src/components/AuthModal.tsx` | Create | Sign in / sign up overlay modal with email + Google OAuth |
| `src/components/Nav.tsx` | Modify | Add Sign In button (logged out) and user avatar dropdown (logged in) |
| `src/pages/PremiumPage.tsx` | Create | Pricing page at `/premium` |
| `src/pages/PremiumSuccessPage.tsx` | Create | Post-checkout success page at `/premium/success` |
| `src/pages/ContentDetailPage.tsx` | Modify | Premium gating logic; pass `hidden={isPremium}` to `CarbonAd` |
| `src/App.tsx` | Modify | Wrap with `<AuthProvider>`; add `/premium` and `/premium/success` routes |
| `supabase/functions/create-checkout-session/index.ts` | Create | Verifies JWT; creates Stripe Checkout session; returns redirect URL |
| `supabase/functions/stripe-webhook/index.ts` | Create | Verifies Stripe signature; handles subscription lifecycle events |

---

## Task 1: Run DB Migration

**Files:**
- Create: `supabase/migrations/001_premium.sql`

This task has two parts: save the SQL file to the repo, then run it manually in Supabase SQL Editor.

**Important before running:** Verify your Supabase project runs PostgreSQL 15+ in Supabase Dashboard → Settings → Database. The `with (security_invoker = true)` view syntax requires Postgres 15+.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/001_premium.sql` with this content:

```sql
-- 1. Add is_premium column to content_items
alter table content_items
  add column if not exists is_premium boolean not null default false;

-- 2. Create subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz not null,
  created_at timestamptz default now()
);

-- One subscription row per user (conflict target for checkout.session.completed upsert)
create unique index if not exists subscriptions_user_id_idx on subscriptions(user_id);

-- RLS: users can read only their own row
alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);
-- No insert/update policies -- only the service-role webhook writes here

-- 3. Premium check function (public schema, NOT auth schema)
--    auth schema functions may be dropped by Supabase platform upgrades
create or replace function public.user_is_premium()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and current_period_end > now()
  )
$$;

-- 4. Content view with body masking (SECURITY INVOKER = runs as calling user,
--    so auth.uid() returns the correct user ID, not the view owner)
--    REQUIRES PostgreSQL 15+
create or replace view public_content_items
  with (security_invoker = true)
as
  select
    id, type, title, author_id, read_time, thumbnail,
    published_at, views, rating, tags, source_url, is_premium,
    -- body_teaser: first 300 chars always visible (used for blur preview on gated content)
    substring(body, 1, 300) as body_teaser,
    -- body: full content for free items or premium subscribers; null for gated content
    case
      when is_premium = false then body
      when public.user_is_premium() then body
      else null
    end as body
  from content_items;

-- Grant SELECT on view to both roles
-- Do NOT revoke SELECT on content_items table -- SECURITY INVOKER requires
-- the calling user to have table-level SELECT for the view to work
grant select on public_content_items to anon, authenticated;
```

- [ ] **Step 2: Run the SQL in Supabase SQL Editor**

1. Open Supabase Dashboard → SQL Editor
2. Paste the entire contents of `supabase/migrations/001_premium.sql`
3. Click Run
4. Expected: no errors; `Success. 0 rows affected.` (DDL statements return this)

- [ ] **Step 3: Verify the view works**

In Supabase SQL Editor, run:
```sql
select id, title, is_premium, body_teaser, body from public_content_items limit 3;
```
Expected: rows returned with `body_teaser` populated (first 300 chars) and `body` showing full content (since no items are marked `is_premium = true` yet).

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/migrations/001_premium.sql
git commit -m "feat: add subscriptions table, is_premium column, and public_content_items view"
```

---

## Task 2: Update `src/lib/types.ts`

**Files:**
- Modify: `src/lib/types.ts`

Breaking change: `body` changes from `string` to `string | null`. Only one callsite is affected (`ContentDetailPage` — fixed in Task 9). All other parts of the app that read `item.body` either don't exist or are updated in this task.

- [ ] **Step 1: Update `ContentItem` interface**

Find the `ContentItem` interface. Change these fields:

```ts
// Before:
body: string
sourceUrl?: string

// After:
body: string | null   // null when content is premium-gated and user is not subscribed
bodyTeaser?: string   // first 300 chars, always present from the view (Phase 2 addition)
isPremium?: boolean   // true if this content requires a subscription
sourceUrl?: string
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: TypeScript will report errors wherever `item.body` is used as `string`. Note each error location — they will be fixed in Task 9. There should be exactly one affected file: `ContentDetailPage.tsx` (the `item.body.split('\n')` call). **The build will fail here — this is intentional.** The error is fixed in Task 9.

- [ ] **Step 3: Commit (even though the build currently fails — the error is fixed in Task 9)**

```bash
git add src/lib/types.ts
git commit -m "feat: update ContentItem type for premium gating (body nullable, add bodyTeaser, isPremium)"
```

---

## Task 3: Update `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

Three changes:
1. All content queries switch from `content_items` table → `public_content_items` view
2. `fetchContentItem` refactored to two sequential queries (views don't support PostgREST FK joins)
3. `mapContent` updated to map `body_teaser` and `is_premium`

- [ ] **Step 1: Change `fetchContent` query target**

Find: `.from('content_items').select('*', { count: 'exact' })` in `fetchContent`
Change to: `.from('public_content_items').select('*', { count: 'exact' })`

- [ ] **Step 2: Change `fetchTrending` query target**

Find: `.from('content_items').select('*').order('views', { ascending: false }).limit(4)` in `fetchTrending`
Change to: `.from('public_content_items').select('*').order('views', { ascending: false }).limit(4)`

- [ ] **Step 3: Change `fetchFeatured` query target**

Find: `.from('content_items').select('*').order('rating', { ascending: false }).limit(1).single()` in `fetchFeatured`
Change to: `.from('public_content_items').select('*').order('rating', { ascending: false }).limit(1).single()`

- [ ] **Step 4: Refactor `fetchContentItem`**

The current implementation uses `.select('*, authors(*)')` — a PostgREST FK join. Views don't inherit FK relationships, so this breaks on `public_content_items`. Replace the entire `fetchContentItem` function:

```ts
export async function fetchContentItem(id: string): Promise<SingleResponse<ContentItemWithAuthor>> {
  const { data: item, error } = await supabase
    .from('public_content_items').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!item) throw new Error('Content not found')
  const { data: author } = await supabase
    .from('authors').select('*').eq('id', item.author_id).single()
  return { data: { ...mapContent(item), author: author ? mapAuthor(author) : undefined } }
}
```

- [ ] **Step 5: Update `mapContent`**

Find the `mapContent` function. Replace its return statement:

```ts
function mapContent(r: any): ContentItem {
  return {
    id: r.id, type: r.type, title: r.title, authorId: r.author_id,
    readTime: r.read_time, thumbnail: r.thumbnail, publishedAt: r.published_at,
    views: r.views, rating: r.rating, tags: r.tags ?? [],
    body: r.body ?? null,             // null when premium-gated
    bodyTeaser: r.body_teaser ?? '',  // always present from view
    sourceUrl: r.source_url ?? undefined,
    isPremium: r.is_premium ?? false,
  }
}
```

- [ ] **Step 6: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: builds successfully except for the pre-existing TypeScript error in `ContentDetailPage.tsx` about `item.body` being `string | null` (fixed in Task 9). If other errors appear, fix them before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: switch content queries to public_content_items view, update mapContent for premium fields"
```

---

## Task 4: Create `src/context/AuthContext.tsx`

**Files:**
- Create: `src/context/AuthContext.tsx`

This is the core of Phase 2. It manages auth state, subscription state, and the checkout flow. The `AuthModal` component is rendered here (inside the provider) rather than in `App.tsx` or individual pages.

Key design decisions:
- Subscription is checked via a raw Supabase query (not TanStack Query) — it's global app state, not page-level data
- `pendingCheckout` is stored in `sessionStorage` (not React state) — survives Google OAuth's full-page redirect
- `openCheckout()` POSTs to the Edge Function with the user's JWT in the `Authorization` header
- `previousSessionRef` distinguishes fresh logins from initial session restores (prevents auto-checkout on every page load)

- [ ] **Step 1: Create the file**

```tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AuthModal from '../components/AuthModal'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isPremium: boolean
  isSubscriptionLoading: boolean
  signOut: () => Promise<void>
  openAuthModal: () => void
  openCheckout: () => Promise<void>
  refreshSubscription: () => Promise<void>
  openCheckoutOrAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const previousSessionRef = useRef<Session | null>(null)

  async function fetchSubscription(userId: string) {
    setIsSubscriptionLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle()
    setIsPremium(!!data)
    setIsSubscriptionLoading(false)
  }

  async function refreshSubscription() {
    if (user) await fetchSubscription(user.id)
  }

  async function openCheckout() {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) return
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.access_token}`,
          },
        }
      )
      if (!res.ok) return
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      // Silently fail — user stays on current page
    }
  }

  function openCheckoutOrAuth() {
    if (user) {
      openCheckout()
    } else {
      sessionStorage.setItem('pendingCheckout', '1')
      setAuthModalOpen(true)
    }
  }

  useEffect(() => {
    // On mount: restore existing session (handles Google OAuth post-redirect)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      previousSessionRef.current = initialSession

      if (initialSession?.user) {
        fetchSubscription(initialSession.user.id)
        // Google OAuth redirect: page reloaded, check pending checkout
        if (sessionStorage.getItem('pendingCheckout')) {
          sessionStorage.removeItem('pendingCheckout')
          openCheckout()
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Fresh email login (not initial session restore or page refresh)
      if (event === 'SIGNED_IN' && newSession && previousSessionRef.current === null) {
        if (sessionStorage.getItem('pendingCheckout')) {
          sessionStorage.removeItem('pendingCheckout')
          openCheckout()
        }
      }

      if (event === 'SIGNED_OUT') {
        setIsPremium(false)
        setIsSubscriptionLoading(false)
      }

      previousSessionRef.current = newSession
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user && event === 'SIGNED_IN') {
        fetchSubscription(newSession.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: AuthContextValue = {
    user, session, isPremium, isSubscriptionLoading,
    signOut: () => supabase.auth.signOut(),
    openAuthModal: () => setAuthModalOpen(true),
    openCheckout,
    refreshSubscription,
    openCheckoutOrAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
This will fail because `AuthModal` doesn't exist yet — that's expected. The error should be only `Cannot find module '../components/AuthModal'`. If other errors appear, fix them before continuing.

- [ ] **Step 3: Commit (even with build error — AuthModal comes next)**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add AuthContext with auth state, subscription check, and openCheckoutOrAuth"
```

---

## Task 5: Create `src/components/AuthModal.tsx`

**Files:**
- Create: `src/components/AuthModal.tsx`

This modal does NOT import from `AuthContext` — it calls Supabase Auth directly. The parent (`AuthProvider`) renders it and passes an `onClose` callback.

- [ ] **Step 1: Create the component**

```tsx
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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
    // Page will navigate — modal closes naturally
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

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%',
            padding: '10px 0',
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>or</div>

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
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` (the `AuthContext` error from Task 4 should now resolve). The only remaining build errors should be in `ContentDetailPage.tsx` (body null issue — fixed in Task 9).

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthModal.tsx
git commit -m "feat: add AuthModal with email and Google OAuth sign in/sign up"
```

---

## Task 6: Update `src/components/Nav.tsx`

**Files:**
- Modify: `src/components/Nav.tsx`

Add "Sign In" button (logged out) and user avatar + dropdown (logged in) to the desktop nav right side and mobile drawer. The existing "Post a Job" and "Find Work" buttons stay.

- [ ] **Step 1: Add `useAuth` import**

At the top of `Nav.tsx`, add:
```tsx
import { useAuth } from '../context/AuthContext'
```

- [ ] **Step 2: Add `useAuth` destructuring inside the component**

Inside `Nav()`, after the existing `const navigate = useNavigate()` line, add:
```tsx
const { user, isPremium, openAuthModal, signOut, openCheckoutOrAuth } = useAuth()
```

- [ ] **Step 3: Replace the desktop right-side button group**

Find the desktop right-side `<div>` (the one containing "Post a Job" and "Find Work" buttons, around line 82). Replace it entirely:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
  <button onClick={() => navigate('/for-studios')} style={{ padding: '7px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}>
    Post a Job
  </button>
  {user ? (
    <UserDropdown
      isPremium={isPremium}
      initials={user.email?.[0]?.toUpperCase() ?? '?'}
      onUpgrade={openCheckoutOrAuth}
      onSignOut={signOut}
    />
  ) : (
    <button
      onClick={openAuthModal}
      style={{ padding: '7px 18px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)', boxShadow: '0 0 20px rgba(255,92,0,0.35)', cursor: 'pointer' }}
    >
      Sign In ▶
    </button>
  )}
</div>
```

Note: the "Find Work" button is replaced by the "Sign In" button for logged-out users. If you want to keep "Find Work", add it back alongside Sign In.

- [ ] **Step 4: Add `UserDropdown` component at the bottom of Nav.tsx (before the export)**

```tsx
interface UserDropdownProps {
  isPremium: boolean
  initials: string
  onUpgrade: () => void
  onSignOut: () => Promise<void>
}

function UserDropdown({ isPremium, initials, onUpgrade, onSignOut }: UserDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          color: 'var(--orange)',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPremium ? '★' : initials}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{
            position: 'absolute', top: 40, right: 0, zIndex: 51,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 180,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {!isPremium && (
              <button
                onClick={() => { setOpen(false); onUpgrade() }}
                style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'none', border: 'none', color: 'var(--orange)', textAlign: 'left', cursor: 'pointer' }}
              >
                ★ Upgrade to Premium
              </button>
            )}
            {isPremium && (
              <button
                onClick={() => setOpen(false)}
                style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}
              >
                ★ Premium Member
              </button>
            )}
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'none', border: 'none', color: 'var(--muted)', textAlign: 'left', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Update mobile drawer**

In the mobile drawer section (around line 127), find the existing button group and add a Sign In / account button. After the existing two buttons (`Post a Job` / `Find Work`), add:

```tsx
{user ? (
  <button
    onClick={() => { signOut(); setOpen(false) }}
    style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer', marginTop: 8 }}
  >
    Sign Out
  </button>
) : (
  <button
    onClick={() => { openAuthModal(); setOpen(false) }}
    style={{ flex: 1, padding: '10px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', marginTop: 8 }}
  >
    Sign In ▶
  </button>
)}
```

- [ ] **Step 6: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` (only the `ContentDetailPage` body null error should remain).

- [ ] **Step 7: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "feat: add auth UI to Nav — Sign In button, user dropdown, premium badge"
```

---

## Task 7: Create `src/pages/PremiumPage.tsx`

**Files:**
- Create: `src/pages/PremiumPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PremiumPage.tsx
git commit -m "feat: add PremiumPage with pricing, benefits, and checkout CTA"
```

---

## Task 8: Create `src/pages/PremiumSuccessPage.tsx`

**Files:**
- Create: `src/pages/PremiumSuccessPage.tsx`

After Stripe redirects here, `refreshSubscription()` is called on mount. Shows a loading state while the subscription query runs, then a success message.

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/PremiumSuccessPage.tsx
git commit -m "feat: add PremiumSuccessPage with subscription activation polling"
```

---

## Task 9: Update `src/pages/ContentDetailPage.tsx`

**Files:**
- Modify: `src/pages/ContentDetailPage.tsx`

Two changes:
1. Fix `item.body.split('\n')` → `(item.body ?? '').split('\n')` (the breaking change from Task 2)
2. Add premium gating — when `item.isPremium && !isPremium`, show blur preview + upsell card instead of full body
3. Pass `hidden={isPremium}` to `CarbonAd` (Phase 1 added `CarbonAd` without the `hidden` prop)

- [ ] **Step 1: Add `useAuth` import**

```tsx
import { useAuth } from '../context/AuthContext'
```

- [ ] **Step 2: Destructure auth state inside the component**

After the existing `const { isMobile } = useBreakpoint()` line, add:
```tsx
const { isPremium, isSubscriptionLoading, openCheckoutOrAuth } = useAuth()
```

- [ ] **Step 3: Fix the body null crash**

Find line 126 (approximately):
```tsx
for (const line of item.body.split('\n')) {
```
Change to:
```tsx
for (const line of (item.body ?? '').split('\n')) {
```

- [ ] **Step 4: Add gating wrapper around the body section**

The body section is the `<div style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.8 }}>` block (around line 120). Wrap it with a conditional:

```tsx
{/* Body — gated for non-premium users when item.isPremium is true */}
{item.isPremium && isSubscriptionLoading ? (
  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
    Loading…
  </div>
) : item.isPremium && !isPremium ? (
  <>
    {/* Blurred teaser */}
    <div style={{ position: 'relative', overflow: 'hidden', maxHeight: 200, marginBottom: 0 }}>
      <div style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.8, pointerEvents: 'none', userSelect: 'none' }}>
        {item.bodyTeaser}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />
    </div>
    {/* Upsell card */}
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 28, background: 'var(--surface)', textAlign: 'center', marginTop: 0 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--orange)', marginBottom: 12 }}>
        Premium Content
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        Unlock the full article
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
        Get ad-free reading and access to all premium guides, tutorials, and devlogs for $7/month.
      </div>
      <button
        onClick={openCheckoutOrAuth}
        style={{ padding: '12px 32px', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 0 20px rgba(255,92,0,0.35)' }}
      >
        Upgrade — $7/month
      </button>
    </div>
  </>
) : (
  // Full body (free content, or logged-in premium user)
  // DO NOT replace the existing body block — wrap it inside this else branch.
  // The existing body section starts with:
  //   {/* Body */}
  //   <div style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.8 }}>
  //     {(() => { /* full markdown renderer */ })()}
  //   </div>
  // Paste that entire existing block here verbatim. Only the surrounding gating conditional is new.
)}
```

- [ ] **Step 5: Pass `hidden={isPremium}` to both `CarbonAd` instances**

If Phase 1 is already implemented: find the two `<CarbonAd />` instances in the file (one in the mobile placement, one in the desktop sidebar). Change both to `<CarbonAd hidden={isPremium} />`.

If Phase 1 has NOT been implemented yet: add both usages with the `hidden` prop from scratch, following the Phase 1 plan placements — mobile between hero and thumbnail, desktop as first child of the sticky sidebar div.




- [ ] **Step 6: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` with zero TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ContentDetailPage.tsx
git commit -m "feat: add premium content gating to ContentDetailPage with blur preview and upsell card"
```

---

## Task 10: Update `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

Two changes: wrap `<BrowserRouter>` with `<AuthProvider>`, and add the two premium routes inside the Layout route.

- [ ] **Step 1: Add imports**

```tsx
import { AuthProvider } from './context/AuthContext'
const PremiumPage        = lazy(() => import('./pages/PremiumPage'))
const PremiumSuccessPage = lazy(() => import('./pages/PremiumSuccessPage'))
```

- [ ] **Step 2: Wrap with `AuthProvider`**

Change:
```tsx
return (
  <BrowserRouter>
```
to:
```tsx
return (
  <AuthProvider>
  <BrowserRouter>
```
And close it:
```tsx
  </BrowserRouter>
  </AuthProvider>
)
```

- [ ] **Step 3: Add routes inside Layout**

Inside the `<Route element={<Layout />}>` block, after the existing routes but before the `<Route path="*" ...>` catch-all, add:
```tsx
<Route path="/premium"         element={<PremiumPage />} />
<Route path="/premium/success" element={<PremiumSuccessPage />} />
```

- [ ] **Step 4: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` with zero TypeScript errors.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```
- Navigate to `http://localhost:5173` — nav shows "Sign In ▶" button
- Click "Sign In ▶" — `AuthModal` opens with Sign In / Sign Up tabs
- Navigate to `/premium` — pricing page renders with "Sign Up & Get Started" button
- Navigate to `/premium/success` — shows loading state then times out with fallback message (no real subscription yet)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app with AuthProvider, add /premium and /premium/success routes"
```

---

## Task 11: Create Edge Function `create-checkout-session`

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`

This function validates the user JWT, creates a Stripe Checkout Session, and returns the redirect URL.

**Note:** Supabase Edge Functions use Deno. Stripe is imported via `https://esm.sh/stripe`.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p d:/GamingWebsite/Loadout/supabase/functions/create-checkout-session
```

- [ ] **Step 2: Create `index.ts`**

```ts
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID')!, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${Deno.env.get('SITE_URL') ?? 'https://loadout.gg'}/premium/success`,
      cancel_url: `${Deno.env.get('SITE_URL') ?? 'https://loadout.gg'}/premium`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat: add create-checkout-session Edge Function with JWT verification"
```

---

## Task 12: Create Edge Function `stripe-webhook`

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

Handles three Stripe events: `checkout.session.completed` (create subscription row), `customer.subscription.updated` (update status), `customer.subscription.deleted` (mark canceled).

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p d:/GamingWebsite/Loadout/supabase/functions/stripe-webhook
```

- [ ] **Step 2: Create `index.ts`**

```ts
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

Deno.serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 })
  }

  // Service-role client bypasses RLS for writing to subscriptions table
  // SUPABASE_SERVICE_ROLE_KEY is auto-provisioned by Supabase — do NOT set it manually
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      if (!userId) throw new Error('Missing client_reference_id')

      // Retrieve the subscription to get current_period_end
      // (not available on the session object directly)
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        status: 'active',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })

    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      // UPDATE only — never insert. Race condition (updated before completed) is
      // handled by checkout.session.completed arriving shortly after.
      await supabaseAdmin.from('subscriptions')
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
```

- [ ] **Step 3: Commit and push**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: add stripe-webhook Edge Function for subscription lifecycle"
git push origin main
```

---

## Task 13: Configure Stripe + Supabase + Deploy Edge Functions

These are manual configuration steps. Complete in order.

- [ ] **Step 1: Create Stripe account and product**

1. Sign up at stripe.com
2. Dashboard → Products → Add product
3. Name: "Loadout Premium", Price: $7.00, Recurring, Monthly
4. Copy the Price ID (starts with `price_...`)

- [ ] **Step 2: Set Edge Function secrets in Supabase**

In Supabase Dashboard → Edge Functions → Manage secrets, add:
- `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys → Secret key
- `STRIPE_WEBHOOK_SECRET` — from Step 3 below (get this after creating the webhook)
- `STRIPE_PRICE_ID` — the Price ID from Step 1
- `SITE_URL` — `https://loadout.gg` (your production URL)

Note: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are auto-provisioned — do NOT add them manually.

- [ ] **Step 3: Deploy Edge Functions**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from Supabase Dashboard → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

- [ ] **Step 4: Configure Stripe webhook**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copy the Signing secret (starts with `whsec_...`) and add it as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets (Step 2).

- [ ] **Step 5: Enable Google OAuth in Supabase**

In Supabase Dashboard → Authentication → Providers → Google:
1. Enable Google
2. Add your Google OAuth client ID and secret
   - Get from Google Cloud Console → APIs & Services → Credentials
   - Add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud Console

- [ ] **Step 6: Verify end-to-end on live site**

After Vercel deploys (triggered by the push in Task 12):
1. Open the live site → "Sign In ▶" in nav
2. Sign up with email
3. Navigate to `/premium` → click "Get Started"
4. Completes Stripe Checkout (use test card `4242 4242 4242 4242`)
5. Redirects to `/premium/success` → "YOU'RE PREMIUM"
6. Nav shows star icon, Carbon Ads disappear
