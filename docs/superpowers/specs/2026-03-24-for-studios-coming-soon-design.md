# For Studios — Coming Soon Page

**Date:** 2026-03-24
**Status:** Pending Review

## Overview

A single `/for-studios` page that replaces all dead `#` links across the site. Studios can sign up to be notified when job posting, studio profiles, and pricing launch. Email signups are stored in Supabase.

## Page Design

**Route:** `/for-studios`
**Browser tab title:** `For Studios — Loadout`

Content:
- Bold "Coming Soon" hero heading with icon (🏢)
- Subtext: "We're building tools for studios to post jobs, manage profiles, and more."
- Three feature preview cards:
  - **Post a Job** — "Reach thousands of gaming professionals actively looking for their next role."
  - **Studio Profile** — "Showcase your studio, culture, and open roles in one place."
  - **Pricing** — "Simple, transparent plans for studios of every size."
- Email input (type="email") + "Notify Me" submit button
- In-flight state: button disabled + label changes to "Submitting…"
- Success state (inline, no page reload): green confirmation — "You're on the list! We'll notify you when we launch."
- Duplicate email state: "You're already on the list!"
- Generic error state (network/server failure): "Something went wrong. Please try again."
- Client-side validation before submit: if email is empty or fails basic format check, show "Please enter a valid email address." inline without making a request.

## Data Layer

### Supabase Table

```sql
create table studio_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
```

### RLS Policies

```sql
-- Enable RLS
alter table studio_waitlist enable row level security;

-- Allow anyone to insert (anonymous signups)
create policy "allow_anon_insert"
  on studio_waitlist
  for insert
  to anon
  with check (true);

-- No select/update/delete from frontend
```

Run these manually in the Supabase SQL Editor before deploying.

### TypeScript

The insert is done inline in the page component using the existing `supabase` client (no generated types). The insert call is typed as `any` — acceptable for this simple one-field insert. Example pattern:

```ts
const { error } = await supabase.from('studio_waitlist').insert({ email })
if (error?.code === '23505') { /* duplicate */ }
else if (error) { /* generic error */ }
else { /* success */ }
```

## Files Changed

| File | Change |
|------|--------|
| `src/pages/ForStudiosPage.tsx` | New page |
| `src/App.tsx` | Add `/for-studios` route |
| `src/components/Footer.tsx` | Update 3 `#` links → `/for-studios` |
| `src/components/Nav.tsx` | Update "Post a Job" button in **both desktop layout and mobile drawer** → `/for-studios` |
| `src/pages/HomePage.tsx` | Update CalloutCard `onClick` to `() => navigate('/for-studios')` |

## Out of Scope

- Actual job submission form
- Studio profile management
- Pricing page content
- Email notifications to collected addresses
