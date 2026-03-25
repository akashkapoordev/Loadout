import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import DOMPurify from 'dompurify'
import { useJob, useJobs } from '../hooks/useJobs'
import JobCard from '../components/JobCard'
import PageHeader from '../components/PageHeader'
import { useBreakpoint } from '../hooks/useBreakpoint'

function sanitizeDescription(html: string): string {
  const decoded = document.createElement('textarea')
  decoded.innerHTML = html
  return DOMPurify.sanitize(decoded.value)
}

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useJob(id!)
  const job = data?.data
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (job) document.title = `${job.title} at ${job.company} — Loadout`
  }, [job])

  const { data: relatedData } = useJobs({ discipline: job?.discipline, limit: 4 })
  const related = relatedData?.data.filter(j => j.id !== id).slice(0, 3) ?? []

  if (isLoading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>
  if (isError) return <div style={{ padding: 40, color: 'var(--muted)' }}>Failed to load job. Please try again.</div>
  if (!job) return <div style={{ padding: 40, color: 'var(--muted)' }}>Job not found.</div>

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 48 }}>

        {/* Main content */}
        <div>
          <Link to="/jobs" style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to Jobs</Link>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: job.companyColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {job.companyLogo}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 6 }}>{job.title}</h1>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--sub)' }}>
                <span>{job.company}</span>
                <span>📍 {job.remote ? 'Remote' : job.location}</span>
                <span>{job.discipline}</span>
                <span>{job.experienceLevel}</span>
                {job.salary && <span style={{ fontFamily: 'var(--mono)', color: 'var(--orange)' }}>{job.salary}</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            className="job-description"
            style={{ fontSize: 15, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 40 }}
            dangerouslySetInnerHTML={{ __html: sanitizeDescription(job.description) }}
          />

          {/* Apply CTA */}
          {isSafeUrl(job.applyUrl) && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', fontSize: 15, fontFamily: 'var(--font-ui)', fontWeight: 700,
                background: 'var(--orange)', color: '#fff', textDecoration: 'none',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                boxShadow: '0 0 24px rgba(255,92,0,0.4)',
              }}
            >
              Apply Now ▶
            </a>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 16 }}>Job Details</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Studio</span>
                {job.studioId ? (
                  <Link to={`/studios/${job.studioId}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}>{job.company}</Link>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{job.company}</span>
                )}
              </div>
              {[
                ['Location', job.remote ? 'Remote' : job.location],
                ['Discipline', job.discipline],
                ['Level', job.experienceLevel],
                ...(job.salary ? [['Salary', job.salary]] : []),
                ['Posted', new Date(job.postedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            {related.length > 0 && (
              <div>
                <PageHeader title="Similar Roles" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {related.map(j => <JobCard key={j.id} job={j} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .job-description h1,.job-description h2,.job-description h3,.job-description h4 {
          color: var(--text); font-family: var(--font-display); font-weight: 700;
          margin: 20px 0 8px;
        }
        .job-description h2 { font-size: 18px; }
        .job-description h3 { font-size: 16px; }
        .job-description p  { margin: 0 0 12px; }
        .job-description ul,.job-description ol { padding-left: 20px; margin: 0 0 12px; }
        .job-description li { margin-bottom: 4px; }
        .job-description a  { color: var(--orange); }
        .job-description strong { color: var(--text); }
      `}</style>
    </div>
  )
}
