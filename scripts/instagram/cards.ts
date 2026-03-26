// scripts/instagram/cards.ts
import type { PostData, JobPost, TutorialPost, StudioPost, StatPost, DevLogPost, RoundupPost } from './types'

const TAG_COLORS: Record<string, string> = {
  'job-spotlight':  '#FF5C00',
  'tutorial':       '#00D4FF',
  'studio-feature': '#9D60FF',
  'industry-stat':  '#39FF83',
  'dev-log':        '#FFB830',
  'weekly-roundup': '#FF5C00',
}

const TAG_LABELS: Record<string, string> = {
  'job-spotlight':  'Job Spotlight',
  'tutorial':       'Tutorial',
  'studio-feature': 'Studio Feature',
  'industry-stat':  'Industry Stat',
  'dev-log':        'Dev Log',
  'weekly-roundup': 'Weekly Roundup',
}

function base(type: string, bodyContent: string): string {
  const color = TAG_COLORS[type]
  const label = TAG_LABELS[type]
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1080px; overflow: hidden; }
  body {
    background: #080810;
    color: #F0F0FF;
    font-family: 'Inter', sans-serif;
    width: 1080px; height: 1080px;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 72px;
    position: relative;
  }
  .corner-glow {
    position: absolute; top: -80px; right: -80px;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(255,92,0,0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .tag {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: ${color};
    background: ${color}18;
    border: 2px solid ${color}55;
    display: inline-block;
    padding: 8px 20px; border-radius: 6px;
  }
  .title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 96px; font-weight: 800;
    color: #F0F0FF; line-height: 1.0;
    text-transform: uppercase;
  }
  .accent-bar { width: 72px; height: 6px; background: ${color}; margin: 28px 0; }
  .meta { font-size: 28px; color: #8888AA; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; }
  .logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 32px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #FF5C00;
  }
  .url { font-family: 'Rajdhani', sans-serif; font-size: 28px; color: #55556A; font-weight: 600; }
  .border-card { border: 1px solid #1E1E35; }
</style>
</head>
<body class="border-card">
  <div class="corner-glow"></div>
  <div><span class="tag">${label}</span></div>
  <div>${bodyContent}</div>
  <div class="bottom">
    <div class="logo">LOADOUT</div>
    <div class="url">builtloadout.com</div>
  </div>
</body>
</html>`
}

function titleBlock(title: string, meta: string, color: string): string {
  return `<div class="title">${title}</div>
  <div class="accent-bar" style="background:${color}"></div>
  <div class="meta">${meta}</div>`
}

function jobCard(p: JobPost): string {
  const loc = p.remote ? 'Remote' : p.location
  const salary = p.salaryBand ? ` · ${p.salaryBand}` : ''
  const meta = `${p.company} · ${loc}${salary}`
  return base('job-spotlight', titleBlock(p.title, meta, TAG_COLORS['job-spotlight']))
}

function tutorialCard(p: TutorialPost): string {
  return base('tutorial', titleBlock(p.title, 'builtloadout.com/tutorials', TAG_COLORS['tutorial']))
}

function studioCard(p: StudioPost): string {
  const meta = `${p.openRoles} open roles · ${p.location}`
  return base('studio-feature', titleBlock(p.name, meta, TAG_COLORS['studio-feature']))
}

function statCard(p: StatPost): string {
  const color = TAG_COLORS['industry-stat']
  // Match leading number/percentage/dollar formats: "73%", "$180B+", "3x", "1 in 4"
  const match = p.stat.match(/^(\$?[\d]+[A-Z]*%?(?:\+|x)?)/)
  const bigNum = match ? match[1] : ''
  const rest = bigNum ? p.stat.slice(bigNum.length).trim() : p.stat

  const body = bigNum
    ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:200px;font-weight:800;color:${color};line-height:1">${bigNum}</div>
       <div style="font-family:'Barlow Condensed',sans-serif;font-size:56px;font-weight:700;color:#F0F0FF;text-transform:uppercase;line-height:1.1;margin-top:12px">${rest}</div>
       <div class="accent-bar" style="background:${color};margin-top:24px"></div>`
    : `<div class="title" style="font-size:64px">${p.stat}</div>
       <div class="accent-bar" style="background:${color}"></div>`

  return base('industry-stat', body)
}

function devlogCard(p: DevLogPost): string {
  const color = TAG_COLORS['dev-log']
  const meta = `by ${p.authorName}`
  return base('dev-log', titleBlock(p.title, meta, color))
}

function roundupCard(p: RoundupPost): string {
  const color = TAG_COLORS['weekly-roundup']
  const items = [`${p.jobCount} new role${p.jobCount !== 1 ? 's' : ''} posted`, ...p.highlights]
  const bullets = items.slice(0, 4).map(h =>
    `<div style="display:flex;gap:20px;align-items:flex-start;padding:16px 0;border-bottom:1px solid #1E1E35">
      <span style="color:${color};font-size:28px;flex-shrink:0">▸</span>
      <span style="font-family:'Inter',sans-serif;font-size:30px;color:#8888AA">${h}</span>
    </div>`
  ).join('')

  const body = `
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:64px;font-weight:800;text-transform:uppercase;margin-bottom:24px">
      THIS WEEK<br>IN GAME DEV
    </div>
    ${bullets}
  `
  return base('weekly-roundup', body)
}

export function buildCard(post: PostData): string {
  switch (post.type) {
    case 'job-spotlight':    return jobCard(post)
    case 'tutorial':         return tutorialCard(post)
    case 'studio-feature':   return studioCard(post)
    case 'industry-stat':    return statCard(post)
    case 'dev-log':          return devlogCard(post)
    case 'weekly-roundup':   return roundupCard(post)
  }
}
