# Content Thumbnails & Bug Fixes — Design Spec
Date: 2026-03-25

## Overview

Three issues to fix across content cards, job descriptions, and seed data:

1. **Bug — Tutorial hero shows body text in thumbnail area** (live DB data fix + defensive code)
2. **Feature — Add real thumbnails to all 12 seed content items + upgrade gradient fallback** (Approach C: hand-picked Unsplash photos + CSS text-overlay fallback)
3. **Bug — Epic Games job description truncated mid-sentence** (data-only, BLOCKED — see Issue 3)

---

## Issue 1: Thumbnail Body-Text Bug

### Root Cause
A content item in the live Supabase database has its `thumbnail` column set to body/source text instead of an image URL. When `item.thumbnail` is truthy (non-empty string), ContentCard tries `background-image: url(body text)`, which fails silently as a broken image — leaving the thumbnail area blank or distorted.

`ContentCard` has no guard: any non-empty string in `thumbnail` is treated as a valid image URL.

### Fix — Two parts

**Part A: Defensive `isImageUrl()` check in `src/components/ContentCard.tsx`**

Add a module-level helper at the top of `ContentCard.tsx` (alongside the existing `thumbGradients` and `typeEmoji` constants):

```ts
function isImageUrl(url: string): boolean {
  try {
    const { protocol, hostname, pathname } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') return false
    const imageHosts = ['images.unsplash.com', 'picsum.photos', 'i.imgur.com', 'cdn.cloudflare.steamstatic.com']
    if (imageHosts.some(h => hostname.endsWith(h))) return true
    return /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(pathname)
  } catch {
    return false
  }
}
```

Change the ContentCard thumbnail condition from:
```tsx
{item.thumbnail ? (
```
to:
```tsx
{item.thumbnail && isImageUrl(item.thumbnail) ? (
```

**Part B: Live DB fix (run in Supabase SQL Editor)**

The offending row contains "This game is currently in development" in its `body` field. Target it directly rather than using a heuristic filter:

```sql
-- Clear bad thumbnail on the offending tutorial row
update content_items
set thumbnail = null
where body like '%This game is currently in development%';
```

This is safe: it targets only rows whose `body` matches the known bad content, not all rows.

---

## Issue 2: Content Thumbnails

### Part A: Seed Data Thumbnails (12 posts)

All URLs use `images.unsplash.com` CDN — reliable, permanent, supports query params for sizing.

| ID | Title | Thumbnail URL |
|----|-------|---------------|
| content-1 | Procedural Dungeon Generator | `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80` |
| content-2 | Hidden Cost of Crunch | `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80` |
| content-3 | Driftwood — Weather System | `https://images.unsplash.com/photo-1428592953211-077101b2021b?w=600&q=80` |
| content-4 | Breaking Into Game Design | `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80` |
| content-5 | Stylised VFX — Fire, Smoke | `https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&q=80` |
| content-6 | AI in Game Development | `https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80` |
| content-7 | Driftwood — Save Systems | `https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80` |
| content-8 | Portfolio to Job Offer | `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80` |
| content-9 | Nanite & Lumen UE5 | `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80` |
| content-10 | Indie Games Winning Narrative | `https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80` |
| content-11 | Shader Graph for Artists | `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80` |
| content-12 | Salary Negotiation | `https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80` |

**Seed SQL change:** The existing `content_items` INSERT uses `ON CONFLICT (id) DO NOTHING` — this must be changed to `ON CONFLICT (id) DO UPDATE SET thumbnail = EXCLUDED.thumbnail` so re-running the seed updates thumbnails on existing rows. The `id` column already has a primary key constraint (confirmed by the existing `ON CONFLICT (id) DO NOTHING` pattern).

**Live DB UPDATE SQL (run in Supabase SQL Editor):**
```sql
update content_items set thumbnail = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80' where id = 'content-1';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80' where id = 'content-2';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=600&q=80' where id = 'content-3';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' where id = 'content-4';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&q=80' where id = 'content-5';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80' where id = 'content-6';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' where id = 'content-7';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80' where id = 'content-8';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80' where id = 'content-9';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80' where id = 'content-10';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' where id = 'content-11';
update content_items set thumbnail = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80' where id = 'content-12';
```

### Part B: ContentCard Fallback Upgrade (title text overlay)

Replace the plain emoji fallback with a styled text overlay. The `typeEmoji` constant becomes dead code and should be removed.

**Layout:** `position: relative` wrapper, with title text in an `position: absolute` centered div on top of the gradient.

**JSX structure for the fallback div:**
```tsx
<div style={{
  width: '100%',
  height: featured ? 180 : 120,
  background: thumbGradients[item.type],
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
}}>
  <div style={{
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.25)',
  }} />
  <div style={{
    position: 'relative',
    zIndex: 1,
    fontSize: featured ? 15 : 13,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }}>
    {item.title}
  </div>
</div>
```

This uses `var(--font-display)` (the project's existing display font token) and `-webkit-line-clamp: 2` for two-line truncation.

---

## Issue 3: Epic Games Job Description Truncation

### Status: BLOCKED — prerequisite data required

**Root cause confirmed:** The job description field in the live DB is truncated. There is no character limit in the code — `JobDetailPage` renders the full `description` field, and `mapJob` in `api.ts` passes it through without truncation.

**What is needed before this can be fixed:**
1. The full description text for the Epic Games job (from Epic's careers site or original source)
2. The job's `id` or exact `title` in the live DB (to target the UPDATE safely)

**Template SQL (fill in before running):**
```sql
update jobs
set description = '[PASTE FULL DESCRIPTION HERE]'
where company = 'Epic Games'
  and title = '[EXACT JOB TITLE]';
```

This issue requires no code changes. It is a one-time data fix the user must complete manually once the full description text is available.

---

## Affected Files

| File | Change |
|------|--------|
| `src/components/ContentCard.tsx` | Add `isImageUrl()` module-level helper; change thumbnail condition; upgrade fallback to title text overlay; remove dead `typeEmoji` constant |
| `supabase/seed-content.sql` | Add `thumbnail` column to all 12 content_items rows; change `ON CONFLICT DO NOTHING` to `ON CONFLICT DO UPDATE SET thumbnail = EXCLUDED.thumbnail` |

## Not Changing

- `ContentListPage.tsx` — passes `featured` prop correctly, no changes needed
- `ContentDetailPage.tsx` — not affected by thumbnail changes
- `src/lib/api.ts` — `mapContent` passes `thumbnail` through correctly already
- Job display code — truncation is data-only, no code changes

## Manual DB Actions Required (run in Supabase SQL Editor, in order)

1. **Fix bad thumbnail row** (Issue 1B):
   ```sql
   update content_items set thumbnail = null
   where body like '%This game is currently in development%';
   ```

2. **Add thumbnails to 12 seed items** (Issue 2A) — 12 UPDATE statements listed above

3. **Fix Epic Games job description** (Issue 3) — BLOCKED, template provided above
