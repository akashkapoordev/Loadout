# Monetization Phase 1: Ads & Affiliate Links — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Carbon Ads to content detail pages and a "Recommended Resources" affiliate section below every article — zero new dependencies, no backend changes, ships independently of Phase 2.

**Architecture:** Three new files (`affiliates.ts`, `AffiliateLink.tsx`, `CarbonAd.tsx`) plus targeted additions to `ContentDetailPage.tsx`. Carbon ad placed in the desktop sidebar and inline on mobile. Affiliate cards filtered by `item.type` and rendered after the article body.

**Tech Stack:** React 19, TypeScript, Vite 8, inline CSS styles. No new npm packages required.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/affiliates.ts` | Create | `AffiliateItem` interface, static config array, `getAffiliatesForType()` |
| `src/components/AffiliateLink.tsx` | Create | Styled resource card with outbound affiliate link |
| `src/components/CarbonAd.tsx` | Create | Carbon Ads script injector; cleanup on unmount; `hidden` prop for Phase 2 |
| `src/pages/ContentDetailPage.tsx` | Modify | Import and render `CarbonAd` + "Recommended Resources" section |
| `.env.example` | Modify | Document `VITE_CARBON_ADS_SERVE` |

---

## Task 1: Create `src/lib/affiliates.ts`

**Files:**
- Create: `src/lib/affiliates.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
import type { ContentType } from './types'

// ContentType values: 'tutorial' | 'article' | 'devlog' | 'guide'

export interface AffiliateItem {
  label: string
  description: string
  href: string      // Replace YOUR_AFFILIATE_ID with real tracking ID after applying
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
  {
    label: 'Unreal Marketplace',
    description: 'High-quality assets and plugins for Unreal Engine projects.',
    href: 'https://www.unrealengine.com/marketplace/en-US/store?pid=YOUR_AFFILIATE_ID',
    cta: 'View Marketplace',
    contentTypes: ['tutorial', 'devlog'],
  },
  {
    label: 'Udemy Game Dev Courses',
    description: 'Learn game development from industry professionals.',
    href: 'https://www.udemy.com/courses/development/game-development/?affcodes=YOUR_AFFILIATE_ID',
    cta: 'Browse Courses',
    contentTypes: ['guide', 'article'],
  },
  {
    label: 'Humble Bundle',
    description: 'Game dev software bundles at pay-what-you-want prices.',
    href: 'https://www.humblebundle.com/?partner=YOUR_AFFILIATE_ID',
    cta: 'View Bundles',
    contentTypes: ['article', 'guide'],
  },
  {
    label: 'Fanatical',
    description: 'Game dev software and asset bundles at discounted prices.',
    href: 'https://www.fanatical.com/?ref=YOUR_AFFILIATE_ID',
    cta: 'Browse Deals',
    contentTypes: ['guide'],
  },
]

export function getAffiliatesForType(type: ContentType): AffiliateItem[] {
  return affiliates.filter(a => a.contentTypes.includes(type))
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` with zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/affiliates.ts
git commit -m "feat: add affiliate config with getAffiliatesForType helper"
```

---

## Task 2: Create `src/components/AffiliateLink.tsx`

**Files:**
- Create: `src/components/AffiliateLink.tsx`

Note: `rel="noopener noreferrer nofollow"` — `nofollow` is required by most affiliate program terms.

- [ ] **Step 1: Create the component**

```tsx
interface Props {
  label: string
  description: string
  href: string
  cta: string
}

export default function AffiliateLink({ label, description, href, cta }: Props) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {description}
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={{
          padding: '7px 16px',
          fontSize: 12,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          background: 'var(--orange)',
          color: '#fff',
          borderRadius: 7,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 12px rgba(255,92,0,0.25)',
          flexShrink: 0,
        }}
      >
        {cta} ↗
      </a>
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
git add src/components/AffiliateLink.tsx
git commit -m "feat: add AffiliateLink resource card component"
```

---

## Task 3: Create `src/components/CarbonAd.tsx`

**Files:**
- Create: `src/components/CarbonAd.tsx`

Carbon Ads injects itself into a container div via a `<script>` tag. The script must have `id="_carbonads_js"` (Carbon's own identifier). On unmount, remove both the script and the `#carbonads` div it creates — this prevents duplicate ads when React Router navigates between articles without a full page reload.

The `hidden` prop is a Phase 2 hook — pass `hidden={isPremium}` when premium auth is added.

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useRef } from 'react'

interface Props {
  hidden?: boolean
}

export default function CarbonAd({ hidden = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const serve = import.meta.env.VITE_CARBON_ADS_SERVE as string | undefined

  useEffect(() => {
    if (hidden || !serve || !containerRef.current) return

    const script = document.createElement('script')
    script.src = serve
    script.id = '_carbonads_js'
    script.async = true
    containerRef.current.appendChild(script)

    return () => {
      script.remove()
      document.getElementById('carbonads')?.remove()
    }
  }, [hidden, serve])

  if (hidden || !serve) return null

  return <div ref={containerRef} style={{ marginBottom: 24 }} />
}
```

- [ ] **Step 2: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs`.

- [ ] **Step 3: Commit**

```bash
git add src/components/CarbonAd.tsx
git commit -m "feat: add CarbonAd component with script injection and unmount cleanup"
```

---

## Task 4: Update `ContentDetailPage.tsx`

**Files:**
- Modify: `src/pages/ContentDetailPage.tsx`

Current file reference: `d:/GamingWebsite/Loadout/src/pages/ContentDetailPage.tsx`

Key line numbers (verify by reading the file — may shift):
- Line 1–17: imports
- Line 86–109: hero section (title, author, date)
- Line 111–117: thumbnail
- Line 186–193: tags section (closing `</div>` at end of left column, line ~194)
- Line 197: sidebar `<div>` starts
- Line 198: sticky container `<div style={{ position: 'sticky', top: 72, ... }}>`

Four changes needed:

**Change 1** — Add three imports after the last existing import line:
```tsx
import CarbonAd from '../components/CarbonAd'
import AffiliateLink from '../components/AffiliateLink'
import { getAffiliatesForType } from '../lib/affiliates'
```

**Change 2** — Mobile ad placement. Insert between the hero `</div>` and the thumbnail block. The hero block (`<div style={{ marginBottom: 32 }}>` wrapping badge + title + author meta) closes at line ~109. The thumbnail conditional (`{item.thumbnail ? (`) is the very next sibling at line ~111. Insert Change 2 **between those two elements** at the same nesting level inside the left column `<div>`:
```tsx
{/* Carbon Ad — mobile only; desktop version lives in the sidebar */}
{isMobile && (
  <div style={{ marginBottom: 24 }}>
    <CarbonAd />
  </div>
)}
```

**Change 3** — Recommended Resources. Insert after the closing `</div>` of the tags block (around line 193), still inside the left column `<div>`:
```tsx
{/* Recommended Resources */}
{getAffiliatesForType(item.type).length > 0 && (
  <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
    <div style={{
      fontSize: 11,
      fontFamily: 'var(--font-ui)',
      fontWeight: 700,
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      color: 'var(--muted)',
      marginBottom: 16,
    }}>
      Recommended Resources
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {getAffiliatesForType(item.type).map(a => (
        <AffiliateLink
          key={a.label}
          label={a.label}
          description={a.description}
          href={a.href}
          cta={a.cta}
        />
      ))}
    </div>
  </div>
)}
```

**Change 4** — Desktop ad in sidebar. Insert as the first child inside the sticky `<div style={{ position: 'sticky', top: 72, ... }}>` (around line 198):
```tsx
{/* Carbon Ad — desktop only; mobile version is above the thumbnail */}
{!isMobile && <CarbonAd />}
```

- [ ] **Step 1: Add the three imports**

After the last import in the file (line 17 — `import { useBreakpoint } from '../hooks/useBreakpoint'`), add:
```tsx
import CarbonAd from '../components/CarbonAd'
import AffiliateLink from '../components/AffiliateLink'
import { getAffiliatesForType } from '../lib/affiliates'
```

- [ ] **Step 2: Add mobile Carbon Ad placement**

Read the file. Find the `<div style={{ marginBottom: 32 }}>` block that wraps the badge, h1 title, and author/date meta. It ends with `</div>` around line 109. The very next thing is the thumbnail conditional at line ~111. Insert Change 2 between those two elements — at the same indentation level as the hero div and thumbnail div.

- [ ] **Step 3: Add Recommended Resources**

Read the file. Find the tags block — the `<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 32 ...` containing `item.tags.map(...)`. It ends with `</div>` around line 193. The very next line (~194) closes the entire left column, immediately followed by a blank line and the `{/* Sidebar */}` comment.

Insert Change 3 using this unique anchor — replace:
```
          </div>
        </div>

        {/* Sidebar */}
```
with:
```
          </div>

          {/* Recommended Resources */}
          {getAffiliatesForType(item.type).length > 0 && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase' as const,
                color: 'var(--muted)',
                marginBottom: 16,
              }}>
                Recommended Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {getAffiliatesForType(item.type).map(a => (
                  <AffiliateLink
                    key={a.label}
                    label={a.label}
                    description={a.description}
                    href={a.href}
                    cta={a.cta}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
```

(This replaces both the left-column closing `</div>` and the `{/* Sidebar */}` comment with the full Change 3 block followed by them.)

- [ ] **Step 4: Add desktop Carbon Ad in sidebar**

Find the `<div style={{ position: 'sticky', top: 72, ...` around line 198. Insert Change 4 as the very first child of that div, before the author card.

- [ ] **Step 5: Verify build**

```bash
cd d:/GamingWebsite/Loadout && npm run build
```
Expected: `✓ built in X.XXs` with zero TypeScript errors.

- [ ] **Step 6: Manual visual check**

```bash
npm run dev
```
Open `http://localhost:5173` and navigate to any content detail page (e.g. `/tutorials/content-1`). Confirm:
- Desktop: sidebar shows an empty `<div ref=...>` at the top (Carbon ad slot — will populate once `VITE_CARBON_ADS_SERVE` is set)
- Mobile (resize browser to <768px): the Carbon ad div appears between the hero section and the thumbnail
- Tutorial/devlog pages: "Recommended Resources" section shows Unity Asset Store and Unreal Marketplace cards below the tags
- Guide pages: shows Udemy and Fanatical cards
- Article pages: shows Udemy and Humble Bundle cards

- [ ] **Step 7: Commit**

```bash
git add src/pages/ContentDetailPage.tsx
git commit -m "feat: add CarbonAd placement and Recommended Resources affiliate section to content detail page"
```

---

## Task 5: Update `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the env var documentation**

Add to the end of `.env.example`:
```
# Your Carbon Ads serve URL from carbonads.com dashboard
# Example: //cdn.carbonads.com/carbon.js?serve=CKYIL23L&placement=loadoutgg
# Leave blank during development (CarbonAd component renders null when unset)
VITE_CARBON_ADS_SERVE=
```

- [ ] **Step 2: Commit and push**

```bash
git add .env.example
git commit -m "chore: document VITE_CARBON_ADS_SERVE env var"
git push origin main
```

---

## After Deployment — Manual Steps

These are not code tasks — complete them after the code ships:

1. **Apply for Carbon Ads:** carbonads.com → sign up → submit your site URL. Approval takes 1–3 business days. Once approved, copy the serve URL from your dashboard and add `VITE_CARBON_ADS_SERVE=<url>` to Vercel environment variables, then redeploy.

2. **Apply for affiliate programs:**
   - Unity Asset Store: unity.com/partners
   - Unreal Marketplace: unrealengine.com/en-US/affiliate-program
   - Udemy: udemy.com/affiliate
   - Humble Bundle: humblebundle.com/info/partners
   - Fanatical: sign up via fanatical.com

3. **Update affiliate URLs:** Once approved and given tracking URLs, replace `YOUR_AFFILIATE_ID` placeholders in `src/lib/affiliates.ts` with the real tracking URLs. Commit and push.
