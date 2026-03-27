# Instagram Content Pipeline — Design Spec
**Date:** 2026-03-26
**Project:** Loadout (builtloadout.com)

---

## Goals

Build an automated Instagram content pipeline for the Loadout brand. Three equal goals:

1. **Attract** game dev professionals to Loadout (drive job applications / sign-ups)
2. **Educate** — surface tutorials, guides, articles, and dev logs from the site
3. **Brand** — establish Loadout as the go-to resource for gaming careers

**Target audience:** Both aspiring game devs (students, career-switchers) and working professionals (artists, programmers, designers).

---

## Approach

A TypeScript script (`scripts/instagram.ts`) that runs on demand — typically once per week. It queries the existing Supabase database, selects the best content per post type, generates styled 1080×1080 PNG cards, writes captions with hashtags, and outputs everything to a `instagram/week-YYYY-WNN/` folder for manual review before scheduling.

Manual review step is intentional — keeps quality control in human hands while eliminating the creative work.

---

## Post Types

Six post types, one per day:

| Day | Type | Data source |
|-----|------|-------------|
| Monday | Job Spotlight | `jobs` table |
| Tuesday | Tutorial | `content` table (type = tutorial) |
| Wednesday | Studio Feature | `studios` table |
| Thursday | Industry Stat | Curated static list in script |
| Friday | Dev Log | `content` table (type = devlog) |
| Sunday | Weekly Roundup | Aggregated from all tables |

---

## Visual Identity

**Style:** Dark + orange accent, matching the site's design system.

- Background: `#080810`
- Surface: `#111120`
- Border: `#1E1E35`
- Accent: `#FF5C00` (orange) — primary
- Tag colors per post type:
  - Job Spotlight: orange `#FF5C00`
  - Tutorial: cyan `#00D4FF`
  - Studio Feature: purple `#9D60FF`
  - Industry Stat: green `#39FF83`
  - Dev Log: amber `#FFB830`
  - Weekly Roundup: orange `#FF5C00`
- Text: `#F0F0FF` (primary), `#8888AA` (secondary), `#55556A` (muted)
- Fonts: Barlow Condensed (display/titles), Rajdhani (UI/tags), Inter (body/meta)
- Logo: `LOADOUT` wordmark in orange, bottom-left of every card
- URL: `builtloadout.com` bottom-right of every card
- Corner glow: subtle orange radial gradient, top-right corner

Card size: 1080×1080px (Instagram square format).

---

## Pipeline Architecture

```
scripts/instagram.ts
│
├── fetchContent()      Queries Supabase: jobs, studios, content (tutorials/devlogs), stats
├── selectPosts()       Picks best candidate per type — newest + most complete record
├── generateCard()      Fills HTML template with data, returns HTML string
├── exportCards()       Launches Puppeteer, screenshots each card at 1080×1080
├── generateCaption()   Builds caption + hashtag block using per-type template
└── buildCalendar()     Writes calendar.md summarising the week's posts
```

---

## Caption Templates

### Job Spotlight
```
🎮 [ROLE] @ [STUDIO]

[1-line hook — what makes this role compelling]

📍 [Location]  💰 [Salary if available]  🗓 Posted [date]

Apply + browse more roles → builtloadout.com/jobs

#gamedev #gamedevelopment #gamejobs #[discipline] #[studio-slug]
```

### Tutorial
```
🛠 [TITLE]

[1-line description of what you'll learn]

Full tutorial → builtloadout.com/tutorials/[slug]

#gamedev #gamedevelopment #[topic] #gamedevtips #indiedev
```

### Studio Feature
```
🏢 [STUDIO NAME]

[1-line about what makes this studio stand out]

[N] open roles right now.

Browse → builtloadout.com/studios/[slug]

#gamedev #gamejobs #[studio-slug] #gamedevelopment
```

### Industry Stat
```
📊 Did you know?

[STAT in bold]

[1-line context or source]

More game dev insights → builtloadout.com

#gamedev #gamedevelopment #gameindustry #gamedevfacts
```

### Dev Log
```
📓 Dev Log: [TITLE]

[1-line teaser]

by [author] — read the full log → builtloadout.com/dev-logs/[slug]

#devlog #indiedev #gamedev #gamedevelopment #[topic]
```

### Weekly Roundup
```
📋 This week on Loadout

▸ [Job count] new roles posted
▸ [Content highlight 1]
▸ [Content highlight 2]
▸ [Studio highlight if any]

Stay current → builtloadout.com

#gamedev #gamedevelopment #gamejobs #weeklyroundup #indiedev
```

---

## Output Structure

```
instagram/
  week-YYYY-WNN/
    mon-job-spotlight.png
    mon-job-spotlight.md
    tue-tutorial.png
    tue-tutorial.md
    wed-studio-feature.png
    wed-studio-feature.md
    thu-industry-stat.png
    thu-industry-stat.md
    fri-dev-log.png
    fri-dev-log.md
    sun-weekly-roundup.png
    sun-weekly-roundup.md
    calendar.md
```

---

## Card Layout Structure

Every card shares the same layout regions:

```
┌──────────────────────────┐
│  [corner glow — top-right]│
│  [TYPE TAG]               │  ← top-left, colored by post type
│                           │
│  [TITLE — large, bold]    │  ← middle, 2–3 lines, uppercase
│  [accent bar — 28px wide] │
│  [meta line — studio/date]│
│                           │
│  LOADOUT    builtloadout  │  ← bottom row, logo left / URL right
└──────────────────────────┘
```

Stat card exception: replaces title block with a large number (48px) + label line.
Weekly Roundup exception: replaces title block with a small heading + 4 bullet lines.

---

## Duplicate Prevention

`selectPosts()` writes a `instagram/.used.json` file tracking every content ID used per post type. On each run it excludes already-used IDs, cycling back to oldest only when all content has been used.

---

## Industry Stat Seed Data

Initial static list (expand over time):

- "73% of game devs are self-taught in at least one discipline"
- "The global games market exceeded $180B in revenue in 2023"
- "Only 1 in 4 game dev job listings require a degree"
- "The average game dev career span is 12+ years"
- "Indie games make up over 50% of titles released on Steam annually"
- "Game designer is the most searched role on builtloadout.com"
- "Remote game dev roles have tripled since 2020"
- "Unity and Unreal together power 70%+ of shipped games"

---

## Dependencies

- `puppeteer` — HTML to PNG screenshot at exact 1080×1080
- Google Fonts (Barlow Condensed, Rajdhani, Inter) — loaded via CDN in card HTML

Add `puppeteer` when ready to implement. All other dependencies already present.

---

## Out of Scope

- Auto-publishing to Instagram (requires Meta Business API + paid scheduling tool — add later if needed)
- AI-generated captions (templates are sufficient; add later if quality needs improvement)
- Story or Reel formats (square posts only for v1)
