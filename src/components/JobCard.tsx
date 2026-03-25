import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Job } from '../lib/types'

export const jobCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
}

const badgeStyle: Record<string, { color: string; bg: string; border: string }> = {
  new:      { color: 'var(--green)',  bg: 'rgba(57,255,131,0.1)',  border: 'rgba(57,255,131,0.3)' },
  hot:      { color: 'var(--red)',    bg: 'rgba(255,58,58,0.1)',   border: 'rgba(255,58,58,0.3)' },
  featured: { color: 'var(--amber)',  bg: 'rgba(255,184,48,0.1)',  border: 'rgba(255,184,48,0.3)' },
  remote:   { color: 'var(--cyan)',   bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.3)' },
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
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'var(--border)' : 'transparent'}`,
        borderLeft: hovered ? '3px solid var(--orange)' : '3px solid transparent',
        background: hovered ? 'var(--surface)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {/* Logo */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 8,
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

      {/* Info */}
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: hovered ? 'var(--orange)' : 'var(--text)',
          marginBottom: 4,
          transition: 'color 0.15s',
        }}>
          {job.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{job.company}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {job.remote ? '🌐 Remote' : `📍 ${job.location}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{job.experienceLevel}</span>
        </div>
      </div>

      {/* Badges + salary */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {job.tags.filter(tag => badgeStyle[tag]).slice(0, 2).map(tag => {
            const s = badgeStyle[tag]
            return (
              <span key={tag} style={{
                fontSize: 10,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 4,
                color: s.color,
                background: s.bg,
                border: `1px solid ${s.border}`,
              }}>
                {tag}
              </span>
            )
          })}
        </div>
        {job.salary && (
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {job.salary}
          </span>
        )}
      </div>
    </motion.div>
  )
}
