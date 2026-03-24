import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useJobs } from '../hooks/useJobs'
import { useStudios } from '../hooks/useStudios'
import { useContent, useFeatured } from '../hooks/useContent'
import { useStats } from '../hooks/useStats'
import { useBreakpoint } from '../hooks/useBreakpoint'
import LiveTicker from '../components/LiveTicker'
import JobCard from '../components/JobCard'
import ContentCard from '../components/ContentCard'
import StudioRow from '../components/StudioRow'
import DisciplineFilter from '../components/DisciplineFilter'
import ActivityFeed from '../components/ActivityFeed'
import TrendingList from '../components/TrendingList'
import CalloutCard from '../components/CalloutCard'
import PageHeader from '../components/PageHeader'
import type { ContentType, Discipline } from '../lib/types'

const contentTabs: Array<{ label: string; type: ContentType }> = [
  { label: 'Tutorials', type: 'tutorial' },
  { label: 'Articles', type: 'article' },
  { label: 'Dev Logs', type: 'devlog' },
  { label: 'Guides', type: 'guide' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [activeTab, setActiveTab] = useState<ContentType>('tutorial')
  const { isMobile, isTablet } = useBreakpoint()
  const isNarrow = isMobile || isTablet

  const { data: jobsData, isLoading: jobsLoading } = useJobs({ discipline: discipline ?? undefined, limit: 6 })
  const { data: allJobsData } = useJobs({ limit: 500 })
  const { data: studiosData } = useStudios()
  const { data: contentData, isLoading: contentLoading } = useContent({ type: activeTab, limit: 5 })
  const { data: statsData } = useStats()
  const { data: featuredData } = useFeatured()

  const jobs = jobsData?.data ?? []
  const allJobs = allJobsData?.data ?? []
  const studios = (studiosData?.data ?? []).slice(0, 4)

  const rolesByStudio = useMemo(() => {
    const map: Record<string, number> = {}
    allJobs.forEach(j => { map[j.studioId] = (map[j.studioId] ?? 0) + 1 })
    return map
  }, [allJobs])
  const contentItems = contentData?.data ?? []
  const featured = featuredData?.data
  const stats = statsData?.data

  return (
    <div>
      <LiveTicker />

      {/* Hero */}
      <div style={{ padding: isMobile ? '32px 20px 28px' : '48px 40px 40px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: isNarrow ? 'column' : 'row', justifyContent: 'space-between', gap: isNarrow ? 32 : 48, alignItems: isNarrow ? 'flex-start' : 'flex-end' }}>
        <motion.div
          style={{ maxWidth: isNarrow ? '100%' : 560 }}
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 8px var(--orange)', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
            The Gaming Industry's Professional Platform
          </motion.div>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 40 : isTablet ? 52 : 64, fontWeight: 900, lineHeight: 1.0, letterSpacing: '-2px', color: 'var(--text)', marginBottom: 16 }}>
            YOUR NEXT<br />
            <span style={{ color: 'var(--orange)' }}>CAREER MOVE</span><br />
            STARTS HERE.
          </motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 28 }}>
            Loadout connects gaming professionals with top studios, publishers, and startups. Jobs, knowledge, and community — all in one place.
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/jobs" style={{
              padding: '10px 22px', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700,
              background: 'var(--orange)', color: '#fff', textDecoration: 'none',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
              boxShadow: '0 0 20px rgba(255,92,0,0.35)',
            }}>
              Browse Open Roles ▶
            </Link>
            <Link to="/studios" style={{
              padding: '10px 22px', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700,
              background: 'transparent', color: 'var(--sub)', textDecoration: 'none',
              border: '1px solid var(--border2)', borderRadius: 7,
            }}>
              Explore Studios
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', minWidth: isNarrow ? 'auto' : 200, flexShrink: 0, width: isNarrow ? '100%' : 'auto', display: isNarrow ? 'grid' : 'block', gridTemplateColumns: isMobile ? '1fr 1fr' : undefined }}
        >
          {[
            { val: stats ? stats.openRoles.toLocaleString() : '—', label: 'Open Roles' },
            { val: stats ? stats.studios.toLocaleString() : '—', label: 'Studios Listed' },
            { val: stats ? stats.members.toLocaleString() : '—', label: 'Professionals' },
            { val: stats ? stats.articles.toLocaleString() : '—', label: 'Articles Published' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--orange)', lineHeight: 1, marginBottom: 2 }}>{s.val}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Filter bar */}
      <div style={{ paddingInline: isMobile ? 20 : 40 }}>
        <DisciplineFilter active={discipline} onChange={setDiscipline} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 360px', paddingInline: isMobile ? 20 : 40 }}>

        {/* Left col */}
        <div style={{ borderRight: isNarrow ? 'none' : '1px solid var(--border)', borderBottom: isNarrow ? '1px solid var(--border)' : 'none', paddingRight: isNarrow ? 0 : 32, paddingTop: 28, paddingBottom: 40 }}>

          {/* Featured Jobs */}
          <PageHeader
            title="Featured Jobs"
            action={
              <Link to="/jobs" style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}>
                View all {jobsData?.total ?? 0} roles →
              </Link>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
            {jobsLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading jobs…</div>
            ) : (
              jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
            )}
          </div>

          {/* Content tabs */}
          <PageHeader title="Latest Content" />
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {contentTabs.map(tab => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: activeTab === tab.type ? 'var(--text)' : 'var(--muted)',
                  borderBottom: activeTab === tab.type ? '2px solid var(--orange)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {contentLoading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading content…</div>
          ) : (featured || contentItems.length > 0) && (
            <div>
              {featured && (
                <div style={{ marginBottom: 16 }}>
                  <ContentCard item={featured} featured />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {contentItems.filter(c => c.id !== featured?.id).slice(0, 4).map(item => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ paddingLeft: isNarrow ? 0 : 28, paddingTop: 28, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Live Activity */}
          <div>
            <PageHeader title="Live Activity" />
            <ActivityFeed />
          </div>

          {/* Hiring Now */}
          <div>
            <PageHeader
              title="Hiring Now"
              action={
                <Link to="/studios" style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}>
                  All studios →
                </Link>
              }
            />
            <div>
              {studios.map(s => <StudioRow key={s.id} studio={{ ...s, openRoles: rolesByStudio[s.id] ?? 0 }} />)}
            </div>
          </div>

          {/* Trending */}
          <div>
            <PageHeader title="Trending" />
            <TrendingList />
          </div>

          {/* Post a Job CTA */}
          <CalloutCard
            icon="🏢"
            title="Hiring Game Talent?"
            description="Post your open roles on Loadout and reach thousands of gaming professionals actively looking for work."
            buttonLabel="Post a Job →"
            onClick={() => navigate('/for-studios')}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
