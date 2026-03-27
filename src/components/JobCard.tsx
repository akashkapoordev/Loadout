import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Job } from '../lib/types'

export const jobCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
}

interface Props {
  job: Job
  index?: number
}

export default function JobCard({ job, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.div
      custom={index}
      variants={jobCardVariants}
      initial="hidden"
      animate="visible"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/jobs/${job.id}`)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/jobs/${job.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        borderRadius: 12,
        border: `1px solid ${hovered ? 'var(--orange)' : 'var(--border)'}`,
        background: hovered ? 'var(--surface)' : 'var(--bg)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hovered ? '0 0 0 1px var(--orange)' : 'none',
      }}
    >
      {/* Logo + company */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: job.companyColor,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          color: '#fff',
          flexShrink: 0,
        }}>
          {job.companyLogo}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.company}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: hovered ? 'var(--orange)' : 'var(--text)',
        marginBottom: 10,
        lineHeight: 1.35,
        transition: 'color 0.15s',
        flexGrow: 1,
      }}>
        {job.title}
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 5,
          background: 'var(--accent-dim)',
          color: 'var(--orange)',
          border: '1px solid rgba(255,92,0,0.2)',
        }}>
          {job.discipline}
        </span>
        <span style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 5,
          background: 'var(--surface)',
          color: 'var(--muted)',
          border: '1px solid var(--border2)',
        }}>
          {job.remote ? 'Remote' : job.location}
        </span>
        <span style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 5,
          background: 'var(--surface)',
          color: 'var(--muted)',
          border: '1px solid var(--border2)',
        }}>
          {job.experienceLevel}
        </span>
      </div>

      {/* Footer: salary + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
          {job.salary ?? ''}
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          color: hovered ? 'var(--orange)' : 'var(--sub)',
          transition: 'color 0.15s',
        }}>
          View Role →
        </span>
      </div>
    </motion.div>
  )
}
