# Content Thumbnails & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken thumbnail rendering bug in ContentCard, upgrade the gradient fallback to show the post title as a styled text overlay, and add real Unsplash thumbnail images to all 12 seed content items.

**Architecture:** All code changes are isolated to `src/components/ContentCard.tsx` (add `isImageUrl()` guard + new fallback JSX) and `supabase/seed-content.sql` (add thumbnail URLs + change conflict strategy). No new files. No new dependencies. Manual SQL runs in Supabase SQL Editor handle the live DB data fixes.

**Tech Stack:** React 19, TypeScript, Vite, Supabase (PostgreSQL), inline CSS styles

---

## File Map

| File | What changes |
|------|-------------|
| `src/components/ContentCard.tsx` | Add `isImageUrl()` helper; guard thumbnail condition; replace emoji fallback with title text overlay; remove `typeEmoji` dead code |
| `supabase/seed-content.sql` | Add `thumbnail` column to all 12 content_items rows; change `ON CONFLICT DO NOTHING` → `ON CONFLICT DO UPDATE SET thumbnail = EXCLUDED.thumbnail` |

---

## Task 1: Add `isImageUrl()` guard to ContentCard

**Files:**
- Modify: `src/components/ContentCard.tsx`

- [ ] **Step 1: Read the current file**

  Open `src/components/ContentCard.tsx` and confirm the current structure. Key things to locate:
  - Lines 7–12: `thumbGradients` constant
  - Lines 14–19: `typeEmoji` constant (will be deleted in Task 2)
  - Line 62: `{item.thumbnail ? (` — this is the condition to change

- [ ] **Step 2: Add `isImageUrl()` above `thumbGradients`**

  Insert this function at the very top of the module, before `thumbGradients`:

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

- [ ] **Step 3: Change the thumbnail condition**

  Change line 62 from:
  ```tsx
  {item.thumbnail ? (
  ```
  to:
  ```tsx
  {item.thumbnail && isImageUrl(item.thumbnail) ? (
  ```

- [ ] **Step 4: Verify build passes**

  ```bash
  cd d:/GamingWebsite/Loadout && npm run build
  ```
  Expected: `✓ built in X.XXs` with zero TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/ContentCard.tsx
  git commit -m "fix: add isImageUrl guard to ContentCard to reject non-image thumbnail values"
  ```

---

## Task 2: Upgrade ContentCard fallback to title text overlay

**Files:**
- Modify: `src/components/ContentCard.tsx`

- [ ] **Step 1: Remove `typeEmoji` constant**

  Delete the entire `typeEmoji` object (currently lines 14–19):
  ```ts
  const typeEmoji: Record<string, string> = {
    tutorial: '🎮',
    article: '📰',
    devlog: '📓',
    guide: '🗺️',
  }
  ```
  This constant will no longer be referenced after the next step.

- [ ] **Step 2: Replace the fallback div JSX**

  The current fallback (the `: (` branch of the thumbnail ternary) looks like:
  ```tsx
  <div style={{
    width: '100%',
    height: featured ? 180 : 120,
    background: thumbGradients[item.type],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: featured ? 40 : 32,
  }}>
    {typeEmoji[item.type]}
  </div>
  ```

  Replace it entirely with:
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

- [ ] **Step 3: Verify no TypeScript errors**

  ```bash
  cd d:/GamingWebsite/Loadout && npm run build
  ```
  Expected: `✓ built in X.XXs` with zero errors. TypeScript should not complain — `-webkit-box` is a valid string, `WebkitLineClamp`/`WebkitBoxOrient` are recognised React CSSProperties.

- [ ] **Step 4: Visual check in dev server**

  ```bash
  npm run dev
  ```
  Open `http://localhost:5173` (or whichever port). Go to `/tutorials`, `/articles`, `/dev-logs`, `/guides`. Confirm:
  - Cards with no thumbnail show the gradient with the title text overlaid (2 lines max)
  - Cards that have a valid thumbnail image still show the image (the guard from Task 1 is working)
  - Featured (hero) card shows the larger text (15px) on a taller (180px) gradient

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/ContentCard.tsx
  git commit -m "feat: upgrade ContentCard fallback from emoji to styled title text overlay"
  ```

---

## Task 3: Add thumbnail URLs to seed SQL

**Files:**
- Modify: `supabase/seed-content.sql`

- [ ] **Step 1: Find the content_items INSERT block**

  Open `supabase/seed-content.sql`. Locate the block starting with:
  ```sql
  insert into content_items (id, type, title, author_id, read_time, published_at, views, rating, tags, body) values
  ```
  This INSERT covers content-1 through content-12.

- [ ] **Step 2: Add `thumbnail` to the column list**

  Change the column list from:
  ```sql
  insert into content_items (id, type, title, author_id, read_time, published_at, views, rating, tags, body) values
  ```
  to:
  ```sql
  insert into content_items (id, type, title, author_id, read_time, published_at, views, rating, tags, body, thumbnail) values
  ```

- [ ] **Step 3: Add thumbnail URL as the last value in each row**

  Each row currently ends with `'...body text...')` or `'...body text...'),`. Add the Unsplash URL as the final value before the closing `)`. The rows are long — add the URL at the end of each. Here are the 12 thumbnail URLs to append in order:

  | Row | ID | Thumbnail URL to append |
  |-----|----|------------------------|
  | 1 | content-1 | `'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'` |
  | 2 | content-2 | `'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80'` |
  | 3 | content-3 | `'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=600&q=80'` |
  | 4 | content-4 | `'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'` |
  | 5 | content-5 | `'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&q=80'` |
  | 6 | content-6 | `'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80'` |
  | 7 | content-7 | `'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'` |
  | 8 | content-8 | `'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80'` |
  | 9 | content-9 | `'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80'` |
  | 10 | content-10 | `'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80'` |
  | 11 | content-11 | `'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'` |
  | 12 | content-12 | `'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80'` |

  Example — content-1 row changes from ending with:
  ```sql
  '...content...'),
  ```
  to:
  ```sql
  '...content...', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'),
  ```

- [ ] **Step 4: Change conflict strategy**

  Find the `on conflict (id) do nothing;` line that closes the content_items INSERT and change it to:
  ```sql
  on conflict (id) do update set thumbnail = excluded.thumbnail;
  ```
  This ensures re-running the seed file will update thumbnails on existing rows.

- [ ] **Step 5: Verify build still passes**

  ```bash
  cd d:/GamingWebsite/Loadout && npm run build
  ```
  Expected: `✓ built in X.XXs` — the seed SQL is not compiled by Vite so this just confirms nothing else broke.

- [ ] **Step 6: Commit**

  ```bash
  git add supabase/seed-content.sql
  git commit -m "feat: add Unsplash thumbnail URLs to all 12 seed content items"
  ```

---

## Task 4: Push to GitHub + provide live DB SQL

**Files:** None (git push + SQL reference)

- [ ] **Step 1: Push to GitHub**

  ```bash
  git push origin main
  ```
  Expected: `main -> main` success. Vercel will auto-deploy.

- [ ] **Step 2: Provide live DB SQL for the user to run**

  The user must run the following in Supabase Dashboard → SQL Editor, **in order**:

  **Block 1 — Fix bad thumbnail (Issue 1 data fix):**
  ```sql
  update content_items
  set thumbnail = null
  where body like '%This game is currently in development%';
  ```

  **Block 2 — Add real thumbnails to existing 12 rows (Issue 2 data fix):**
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

  After running Block 2, confirm: `Success. 12 rows affected.`

- [ ] **Step 3: Confirm live site**

  After Vercel deploys (1–2 minutes after push), open the live site and verify:
  - `/tutorials`, `/articles`, `/guides`, `/dev-logs` — all 12 seed content cards show real photos
  - The previously broken tutorial hero no longer shows body text (the bad thumbnail row is now NULL, so the text-overlay fallback renders instead)
  - Any non-seed content items (with no thumbnail) show the styled title text overlay instead of a blank area

---

## Blocked: Epic Games Job Description (Issue 3)

This requires no code changes. To fix it:

1. Find the full description text for the Epic Games job on their careers site
2. Run in Supabase SQL Editor:
   ```sql
   update jobs
   set description = '[PASTE FULL DESCRIPTION HERE]'
   where company = 'Epic Games'
     and title = '[EXACT JOB TITLE AS IN DB]';
   ```

No action needed in this plan.
