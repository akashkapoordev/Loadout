import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ContentItem } from '../lib/types'
import ContentTypeBadge from './ContentTypeBadge'

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

const thumbGradients: Record<string, string> = {
  tutorial: 'linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%)',
  article:  'linear-gradient(135deg, #0E1A0A 0%, #1a3a14 100%)',
  devlog:   'linear-gradient(135deg, #1A0A28 0%, #3a1a5c 100%)',
  guide:    'linear-gradient(135deg, #1A1208 0%, #3a2a10 100%)',
}

interface Props {
  item: ContentItem
  featured?: boolean
}

export default function ContentCard({ item, featured = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  const path = item.type === 'devlog'
    ? `/dev-logs/${item.id}`
    : `/${item.type}s/${item.id}`

  const date = new Date(item.publishedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="button"
      tabIndex={0}
      onClick={() => navigate(path)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--surface)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Thumbnail */}
      {item.thumbnail && isImageUrl(item.thumbnail) ? (
        <div style={{
          width: '100%',
          height: featured ? 180 : 120,
          backgroundImage: `url(${item.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      ) : (
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
      )}

      {/* Body */}
      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 6 }}>
          <ContentTypeBadge type={item.type} />
        </div>
        <div style={{
          fontSize: featured ? 16 : 14,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.35,
          marginBottom: 8,
        }}>
          {item.title}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{date}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
          <span>{item.readTime} min read</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
          {item.views > 0 && <span>{(item.views / 1000).toFixed(1)}k views</span>}
        </div>
      </div>
    </motion.div>
  )
}
