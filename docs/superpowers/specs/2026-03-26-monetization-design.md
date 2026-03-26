# Monetization Design — Loadout
Date: 2026-03-26

## Overview

Two-phase monetization strategy for the Loadout gaming content + jobs platform. The platform is early-stage with no significant audience yet, so monetization must not depend on studios paying to post jobs. Instead, revenue comes from the content audience itself.

**Phase 1 — Quick Revenue (no auth required, ships immediately)**
- Carbon Ads on content detail pages
- Affiliate link cards in a "Recommended Resources" section at the bottom of every content detail page

**Phase 2 — Premium Membership (builds on existing content system)**
- Supabase Auth (email + Google OAuth)
- Stripe monthly subscription ($7/month)
- Ad-free experience + premium-gated content for subscribers

The two phases are fully independent. Phase 1 ships without Phase 2 existing. Phase 2 layers on top of the existing content system.

---

## Phase 1: Ads + Affiliate Links

### Carbon Ads

Carbon Ads is a developer-focused ad network with significantly higher CPM ($2–5) than generic ad networks. It serves a single, non-intrusive ad per page.

**Component:** `src/components/CarbonAd.tsx`
- Dynamically injects the Carbon Ads `<script>` tag into the DOM on mount using `useEffect`
- The script `src` is `import.meta.env.VITE_CARBON_ADS_SERVE` — the unique serve URL from the Carbon Ads dashboard (e.g. `//cdn.carbonads.com/carbon.js?serve=CKYIL23L&placement=loadoutgg`)
- If `VITE_CARBON_ADS_SERVE` is undefined or empty, the component renders `null` (safe during development)
- Cleans up the injected script and `#carbonads` div on unmount to avoid duplicates on route change
- Props: `hidden?: boolean` — renders `null` when `true` (Phase 2 integration point for premium users)

**Placement in `ContentDetailPage`:**
- Desktop: sidebar to the right of the article body (240px wide, `position: sticky; top: 24px`)
- Mobile: inline block below the article title, above the body
- In Phase 2: `<CarbonAd hidden={isPremium} />`. During subscription load (`isSubscriptionLoading === true`), `hidden` is `false` so the ad renders until premium status is confirmed.

**`.env.example` addition:**
```
VITE_CARBON_ADS_SERVE=  # Your Carbon Ads serve URL (from carbonads.com dashboard)
```

### Affiliate Links

A curated set of outbound links to affiliate programs relevant to game developers, rendered as cards at the bottom of every content detail page.

**Note:** Affiliate links are NOT embedded inline inside content body text. The `body` column stores plain text/HTML in the DB and cannot contain JSX components. All affiliate links render exclusively in the "Recommended Resources" section below the article body.

**Affiliate programs:**
| Program | Commission | Relevant content types |
|---------|-----------|----------------------|
| Unity Asset Store | 10% | tutorial, devlog |
| Unreal Marketplace | 10% | tutorial, devlog |
| Udemy (game dev courses) | 15% | guide, article |
| Humble Bundle game dev bundles | 15% | article, guide |
| Fanatical (software bundles) | 15% | guide |

**Component:** `src/components/AffiliateLink.tsx`
- Renders a styled "Recommended Resource" card: label, short description, outbound CTA button
- `target="_blank" rel="noopener noreferrer nofollow"` on the link (`nofollow` required by affiliate terms)
- Props interface:
  ```ts
  interface AffiliateLinkProps {
    label: string       // e.g. "Unity Asset Store"
    description: string // e.g. "Browse 100k+ game dev assets"
    href: string        // affiliate tracking URL
    cta: string         // button text, e.g. "Browse Assets"
  }
  ```

**Config:** `src/lib/affiliates.ts`

The existing `ContentType` definition (from `src/lib/types.ts`) is:
```ts
export type ContentType = 'tutorial' | 'article' | 'devlog' | 'guide'
```
The `contentTypes` arrays in `affiliates.ts` must use exactly these string literals.

```ts
import type { ContentType } from './types'

export interface AffiliateItem {
  label: string
  description: string
  href: string
  cta: string
  contentTypes: ContentType[]
}

export const affiliates: AffiliateItem[] = [
  {
    label: 'Unity Asset Store',
    description: 'Browse 100k+ game dev assets, tools, and templates.',
    href: 'https://assetstore.unity.com/?aid=YOUR_AFFILIATE_ID',
    cta: 'Browse Assets',
    contentTypes: ['tutorial', 'devlog'],
  },
  // ... one entry per affiliate program listed in table above
]

export function getAffiliatesForType(type: ContentType): AffiliateItem[] {
  return affiliates.filter(a => a.contentTypes.includes(type))
}
```

**"Recommended Resources" section in `ContentDetailPage`:**
- Renders after the article body
- Uses `getAffiliatesForType(item.type)` — if the array is empty, the section is not rendered

---

## Phase 2: Premium Membership

### Auth — Supabase Auth

**Methods:** Email + password and Google OAuth

**Component:** `src/components/AuthModal.tsx`
- Overlay modal (`position: fixed; inset: 0; z-index: 9999`)
- Two tabs: Sign In / Sign Up
- Google OAuth button calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Email form calls `supabase.auth.signInWithPassword` (Sign In) / `supabase.auth.signUp` (Sign Up)
- On successful auth, modal closes; `AuthContext` detects session change via `onAuthStateChange`
- Error states: wrong password → "Incorrect email or password", email already in use → "An account with that email already exists", network error → "Something went wrong. Please try again." — displayed inline below the form

**Context:** `src/context/AuthContext.tsx`

Full context shape:
```ts
interface AuthContextValue {
  user: User | null
  session: Session | null
  isPremium: boolean
  isSubscriptionLoading: boolean
  signOut: () => Promise<void>
  openAuthModal: () => void
  openCheckout: () => Promise<void>
  refreshSubscription: () => Promise<void>
  openCheckoutOrAuth: () => void  // sets sessionStorage pendingCheckout + opens auth if logged out, or opens checkout if logged in
}
```

**Subscription check logic:**
- On mount: `supabase.auth.getSession()` and subscribe to `onAuthStateChange`
- The Supabase JS v2 client (`src/lib/supabase.ts`) automatically attaches the active session JWT to all queries — no manual `setSession()` call needed. The subscription query issued from `AuthContext` using the shared `supabase` client instance will correctly pass the user's JWT, satisfying the RLS policy `auth.uid() = user_id`.
- When `user` becomes non-null (login event): set `isSubscriptionLoading = true`, query:
  ```ts
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()
  setIsPremium(!!data)
  setIsSubscriptionLoading(false)
  ```
- `refreshSubscription()`: re-runs the same query (used by success page after Stripe redirect)
- When `user` becomes null (logout): reset `isPremium = false`, `isSubscriptionLoading = false`

**Post-login checkout intent — `pendingCheckout`:**

The pending checkout flag must survive a full-page navigation. `signInWithOAuth` (Google) always triggers a full OAuth redirect — the page is unloaded and reloaded. An in-memory ref would be reset. Use `sessionStorage`:

**`openCheckoutOrAuth()`** — single entry point for all "upgrade" CTAs:
```ts
function openCheckoutOrAuth() {
  if (user) {
    openCheckout()
  } else {
    sessionStorage.setItem('pendingCheckout', '1')
    openAuthModal()
  }
}
```
All "Upgrade" buttons and gated content CTAs call `openCheckoutOrAuth()`. This replaces the separate `setPendingCheckout` call.

- When called with `user === null`:
  1. `sessionStorage.setItem('pendingCheckout', '1')`
  2. Call `openAuthModal()`
- For email login (no page reload): on `SIGNED_IN` event where `previousSessionRef.current === null`, check `sessionStorage.getItem('pendingCheckout')`. If set, clear it and call `openCheckout()`.
- For Google OAuth (page reload): on mount in `AuthContext`, after `supabase.auth.getSession()` returns a valid session, check `sessionStorage.getItem('pendingCheckout')`. If set, clear it and call `openCheckout()`.
- `previousSessionRef` is still used to distinguish a fresh email login from an initial session restore — only needed for the email path.

```ts
// On mount (handles Google OAuth post-redirect case):
const { data: { session } } = await supabase.auth.getSession()
if (session && sessionStorage.getItem('pendingCheckout')) {
  sessionStorage.removeItem('pendingCheckout')
  openCheckout()
}

// In onAuthStateChange (handles email login case):
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session && previousSessionRef.current === null) {
    if (sessionStorage.getItem('pendingCheckout')) {
      sessionStorage.removeItem('pendingCheckout')
      openCheckout()
    }
  }
  previousSessionRef.current = session
  setSession(session)
  setUser(session?.user ?? null)
})
```

**`AuthProvider` placement:** wraps `<BrowserRouter>` in `src/App.tsx`. The existing structure is `<BrowserRouter><Suspense><Routes>...` — wrap `<BrowserRouter>` with `<AuthProvider>` so context is available to all routes including `Nav.tsx` inside `<Layout />`.

**Navbar changes (`src/components/Nav.tsx`):**
- Right side: "Sign In" button when `user === null` → calls `openAuthModal()`
- Right side: avatar with user initials when `user !== null`
  - Dropdown: "Upgrade to Premium" (shown only if `!isPremium`), "Manage Subscription" (shown only if `isPremium`, navigates to `/premium`), "Sign Out"
- Orange crown icon next to initials if `isPremium === true`

### Stripe Subscription

**Plan:** Single tier — $7/month (USD). Created manually in Stripe Dashboard. Price ID stored as `STRIPE_PRICE_ID` in Supabase Edge Function secrets.

**Checkout flow:**
```
User clicks "Upgrade to Premium" (must be logged in)
  → openCheckout() in AuthContext
  → supabase.auth.getSession() to get current JWT
  → POST /functions/v1/create-checkout-session
      Authorization: Bearer <JWT>
      Body: {} (empty — user identity extracted from JWT server-side)
  → Edge Function:
      1. Extracts JWT from Authorization header
      2. Creates anon-key Supabase client, calls supabase.auth.getUser(jwt)
         - If error/invalid: return 401 { error: 'Unauthorized' }
      3. user.id and user.email extracted from verified JWT
      4. Creates Stripe Checkout Session:
           price:                Deno.env.get('STRIPE_PRICE_ID')
           mode:                 'subscription'
           client_reference_id:  user.id
           customer_email:       user.email
           success_url:          https://loadout.gg/premium/success
           cancel_url:           https://loadout.gg/premium
      5. Returns { url: session.url }
  → Frontend: window.location.href = url
  → User completes payment on Stripe-hosted page
  → Stripe fires checkout.session.completed webhook
```

**Edge Functions:**

`supabase/functions/create-checkout-session/index.ts`
- JWT verification as described above
- Stripe API: `STRIPE_SECRET_KEY` from `Deno.env.get('STRIPE_SECRET_KEY')`
- Returns `{ url: string }` on success, `{ error: string }` with HTTP 400/401/500 on failure

`supabase/functions/stripe-webhook/index.ts`
- Reads raw request body as text (required for Stripe signature verification)
- `stripe.webhooks.constructEvent(rawBody, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET'))` — return 400 on invalid signature
- Uses service-role Supabase client (`SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS on all writes
- Event handling:

  **`checkout.session.completed`:**
  ```
  userId = session.client_reference_id
  stripeCustomerId = session.customer
  stripeSubscriptionId = session.subscription
  // current_period_end is NOT on the session object — must retrieve the Subscription:
  subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  // Upsert with user_id as conflict target (one row per user)
  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    status: 'active',
    current_period_end: currentPeriodEnd,
  }, { onConflict: 'user_id' })
  ```

  **`customer.subscription.updated`:**
  ```
  // UPDATE only — never insert. If the row doesn't exist yet (race condition where
  // updated fires before checkout.session.completed), this silently matches zero rows.
  // This is acceptable: checkout.session.completed will arrive shortly and create the row.
  // Do NOT upsert here — the upsert would fail the NOT NULL constraint on user_id
  // since this event has no user_id mapping.
  await supabaseAdmin.from('subscriptions')
    .update({
      status: event.data.object.status,
      current_period_end: new Date(event.data.object.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', event.data.object.id)
  ```

  **`customer.subscription.deleted`:**
  ```
  await supabaseAdmin.from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', event.data.object.id)
  ```

### DB: `subscriptions` table

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz not null,
  created_at timestamptz default now()
);

create unique index subscriptions_user_id_idx on subscriptions(user_id);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);
-- No insert/update policies — only the service-role webhook writes to this table
```

### Premium Content Gating

**DB change:**
```sql
alter table content_items
  add column if not exists is_premium boolean not null default false;
```

**Body exposure via Postgres view:**

The `content_items` table RLS policy is public-read (all rows, all columns accessible to anon and authenticated). Postgres RLS does not support column-level restrictions, so a view is used to mask `body` for non-premium users.

```sql
-- Helper in public schema (NOT auth schema — functions in auth schema
-- may be dropped by Supabase platform upgrades)
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

-- SECURITY INVOKER: view executes as the calling user, so auth.uid() returns
-- the correct user ID. Requires Postgres 15+ (verify in Supabase Dashboard →
-- Settings → Database before running this migration).
-- The calling user (anon or authenticated) must have SELECT on content_items —
-- DO NOT revoke SELECT on content_items from anon/authenticated, as SECURITY INVOKER
-- requires the calling user's privileges to read the underlying table.
-- The existing public-read RLS policy on content_items remains in place.
create view public_content_items
  with (security_invoker = true)
as
  select
    id, type, title, author_id, read_time, thumbnail,
    published_at, views, rating, tags, source_url, is_premium,
    -- body_teaser: first 300 chars, always returned regardless of premium status
    -- Used for the blur preview on gated content in ContentDetailPage
    substring(body, 1, 300) as body_teaser,
    -- body: full text for free content or premium subscribers; null for gated content
    case
      when is_premium = false then body
      when public.user_is_premium() then body
      else null
    end as body
  from content_items;

grant select on public_content_items to anon, authenticated;
```

**Security note — known bypass:** Any API caller (zero sophistication required) can call `supabase.from('content_items').select('body').eq('is_premium', true)` and read all premium body content unobstructed, because `content_items` retains its public-read RLS policy. The view provides no security against direct table access — it only ensures the in-app experience correctly gates content. Fully enforcing premium access would require revoking direct table SELECT and routing all content reads through a Supabase Edge Function that enforces subscription status. This is deferred: for an early-stage Phase 2 with a small amount of premium content, the view approach is an accepted trade-off. **Implementers should not claim the view "secures" premium content** — it only provides in-app gating.

**`api.ts` changes (Phase 2):**

1. Change all content queries from `content_items` to `public_content_items`:
   - `fetchContent`, `fetchTrending`, `fetchFeatured`: change `.from('content_items')` → `.from('public_content_items')`
   - `fetchContentItem`: Views do not inherit PostgREST FK relationships, so `.select('*, authors(*)')` breaks on the view. Refactor to two sequential queries:
     ```ts
     export async function fetchContentItem(id: string): Promise<SingleResponse<ContentItemWithAuthor>> {
       const { data: item, error } = await supabase
         .from('public_content_items').select('*').eq('id', id).maybeSingle()
       if (error) throw error
       if (!item) throw new Error('Content not found')  // .maybeSingle() returns null (no error) when no row found
       const { data: author } = await supabase
         .from('authors').select('*').eq('id', item.author_id).single()
       return { data: { ...mapContent(item), author: author ? mapAuthor(author) : undefined } }
     }
     ```

2. Update `mapContent`:
   ```ts
   function mapContent(r: any): ContentItem {
     return {
       id: r.id, type: r.type, title: r.title, authorId: r.author_id,
       readTime: r.read_time, thumbnail: r.thumbnail, publishedAt: r.published_at,
       views: r.views, rating: r.rating, tags: r.tags ?? [],
       body: r.body ?? null,            // null when premium-gated
       bodyTeaser: r.body_teaser ?? '',  // always present
       sourceUrl: r.source_url ?? undefined,
       isPremium: r.is_premium ?? false,
     }
   }
   ```

**`ContentItem` type changes (`src/lib/types.ts`):**
```ts
export interface ContentItem {
  // ... existing fields, with these changes:
  body: string | null   // breaking change from string — null when premium-gated
  bodyTeaser?: string   // Phase 2 addition
  isPremium?: boolean   // Phase 2 addition
}
```

**Breaking change audit — callsites that pass `item.body` as `string`:**
- `ContentDetailPage.tsx` — renders body via `dangerouslySetInnerHTML={{ __html: item.body }}`. Change to `dangerouslySetInnerHTML={{ __html: item.body ?? '' }}` (or skip rendering if null, which is the gated case anyway)
- No other files currently consume `item.body` — verify with grep before implementing

**`ContentDetailPage` gating logic:**
- If `isSubscriptionLoading && item.isPremium`: render a loading spinner in the body area (prevents flash of gate for premium users whose subscription hasn't loaded yet)
- If `!isSubscriptionLoading && item.isPremium && !isPremium`:
  - Render `item.bodyTeaser` with a bottom-fade gradient overlay
  - Below: premium upsell card with benefit list + "Upgrade — $7/month" button
  - Button calls `openCheckoutOrAuth()`
- Otherwise: render full `item.body ?? ''` as normal
  - Note: `ContentDetailPage` currently calls `item.body.split('\n')` — this will throw if `body` is `null`. The `?? ''` guard must be applied at the split call site: `(item.body ?? '').split('\n')`, not at `dangerouslySetInnerHTML` (which is not used in this file)

### Pages

**`src/pages/PremiumPage.tsx` — route `/premium`:**
- Hero: "LOADOUT PREMIUM", $7/month price, benefits list
- CTA: calls `openCheckoutOrAuth()` (handles logged-in and logged-out states)
- If `isPremium`: "You're a member" state + "Manage Subscription" link to Stripe Customer Portal (future)

**`src/pages/PremiumSuccessPage.tsx` — flat sibling route `/premium/success`:**
- Separate component (NOT nested inside `PremiumPage` — uses a flat route in `App.tsx`, no `<Outlet>` needed)
- On mount: calls `refreshSubscription()` from `AuthContext`
- Shows loading spinner while `isSubscriptionLoading === true`
- Once `isPremium === true`: "You're now a Loadout Premium member" with link to browse content
- If `isPremium` is still `false` after 10 seconds: "Payment received — it may take a moment to activate. Please refresh the page."

**`App.tsx` route additions:**
Both routes are nested inside the existing `<Route element={<Layout />}>` wrapper (same as all other pages) so they render with Nav and Footer:
```tsx
<Route element={<Layout />}>
  {/* ... existing routes ... */}
  <Route path="/premium"         element={<PremiumPage />} />
  <Route path="/premium/success" element={<PremiumSuccessPage />} />
</Route>
```

---

## Affected Files

### Phase 1
| File | Change |
|------|--------|
| `src/components/CarbonAd.tsx` | New |
| `src/components/AffiliateLink.tsx` | New |
| `src/lib/affiliates.ts` | New |
| `src/pages/ContentDetailPage.tsx` | Add CarbonAd + Recommended Resources section |
| `.env.example` | Add `VITE_CARBON_ADS_SERVE` |

### Phase 2
| File | Change |
|------|--------|
| `src/context/AuthContext.tsx` | New |
| `src/components/AuthModal.tsx` | New |
| `src/components/Nav.tsx` | Add sign in button + user dropdown |
| `src/pages/PremiumPage.tsx` | New |
| `src/pages/PremiumSuccessPage.tsx` | New |
| `src/pages/ContentDetailPage.tsx` | Add gating logic + `CarbonAd hidden={isPremium}` |
| `src/lib/api.ts` | Queries → `public_content_items`; refactor `fetchContentItem`; update `mapContent` |
| `src/lib/types.ts` | `body: string → string \| null`; add `bodyTeaser?`, `isPremium?` |
| `src/App.tsx` | Add routes; wrap with `<AuthProvider>` |
| `supabase/functions/create-checkout-session/index.ts` | New |
| `supabase/functions/stripe-webhook/index.ts` | New |
| `supabase/migrations/001_premium.sql` | New |

## Not Changing

- `ContentListPage.tsx` — no gating on list pages; `public_content_items` view returns title/thumbnail for all rows regardless of subscription
- `JobsPage.tsx` / `JobDetailPage.tsx` — out of scope
- `ForStudiosPage.tsx` — waitlist stays as-is
- `StudiosPage.tsx` / `StudioDetailPage.tsx` — no changes
- `HomePage.tsx` — `featured` / `trending` use `public_content_items` but body is not rendered on home

## Manual Steps Required

**Phase 1:**
1. Apply for Carbon Ads at carbonads.com (1–3 days approval); get serve URL; set `VITE_CARBON_ADS_SERVE` in `.env` and Vercel env vars
2. Apply for Unity Asset Store, Udemy, Humble Bundle, Fanatical affiliate programs; update `href` values in `src/lib/affiliates.ts`

**Phase 2:**
1. Create Stripe account; create $7/month recurring product; copy the Price ID
2. Set Supabase Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
   Note: `SUPABASE_SERVICE_ROLE_KEY` is auto-provisioned by the Supabase platform — do NOT set it manually
3. Configure Stripe webhook: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` — events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Enable Google OAuth in Supabase Auth dashboard (Providers → Google)
5. Add `https://loadout.gg/premium/success` and `https://loadout.gg` to Stripe allowed redirect URLs
6. Verify Postgres ≥ 15 in Supabase Dashboard → Settings → Database
7. Run `supabase/migrations/001_premium.sql` in Supabase SQL Editor
