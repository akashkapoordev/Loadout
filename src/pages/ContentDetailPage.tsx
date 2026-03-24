import { useParams, Link } from 'react-router-dom'
import { useContentItem, useContent } from '../hooks/useContent'
import ContentCard from '../components/ContentCard'
import ContentTypeBadge from '../components/ContentTypeBadge'
import TrendingList from '../components/TrendingList'
import PageHeader from '../components/PageHeader'

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useContentItem(id!)
  const item = data?.data

  const { data: relatedData } = useContent({
    type: item?.type,
    limit: 4,
  })
  const related = relatedData?.data.filter(c => c.id !== id).slice(0, 3) ?? []

  if (isLoading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>
  if (!item) return <div style={{ padding: 40, color: 'var(--muted)' }}>Content not found.</div>

  const backPath = item.type === 'devlog' ? '/dev-logs' : `/${item.type}s`
  const backLabel = item.type === 'devlog' ? 'Dev Logs' : `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}s`
  const date = new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ paddingInline: 40, paddingTop: 32, paddingBottom: 60 }}>
      <Link to={backPath} style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Back to {backLabel}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>

        {/* Article body */}
        <div>
          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 12 }}>
              <ContentTypeBadge type={item.type} size="md" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>
              {item.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
              {item.author && (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>
                    {item.author.name.charAt(0)}
                  </div>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.author.name}</span>
                  <span>·</span>
                </>
              )}
              <span>{date}</span>
              <span>·</span>
              <span>{item.readTime} min read</span>
              <span>·</span>
              <span>{(item.views / 1000).toFixed(1)}k views</span>
            </div>
          </div>

          <div style={{ height: 200, borderRadius: 12, background: `linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 32 }}>
            🎮
          </div>

          {/* Body */}
          <div style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.8 }}>
            {item.body.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', margin: '32px 0 16px' }}>{line.slice(2)}</h2>
              if (line.startsWith('## ')) return <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '24px 0 12px' }}>{line.slice(3)}</h3>
              if (line === '') return <br key={i} />
              return <p key={i} style={{ marginBottom: 16 }}>{line}</p>
            })}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {item.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--muted)' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Author card */}
            {item.author && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--orange)', flexShrink: 0 }}>
                    {item.author.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.author.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.author.role}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>{item.author.bio}</p>
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div>
                <PageHeader title="Related" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {related.map(c => <ContentCard key={c.id} item={c} />)}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <PageHeader title="Trending" />
              <TrendingList />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
