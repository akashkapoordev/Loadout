import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useContentItem, useContent } from '../hooks/useContent'

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}
import ContentCard from '../components/ContentCard'
import ContentTypeBadge from '../components/ContentTypeBadge'
import TrendingList from '../components/TrendingList'
import PageHeader from '../components/PageHeader'
import { useBreakpoint } from '../hooks/useBreakpoint'
import CarbonAd from '../components/CarbonAd'
import GoogleAd from '../components/GoogleAd'
import AffiliateLink from '../components/AffiliateLink'
import { getAffiliatesForType } from '../lib/affiliates'

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useContentItem(id!)
  const item = data?.data

  const { data: relatedData } = useContent({
    type: item?.type,
    limit: 4,
  })
  const related = relatedData?.data.filter(c => c.id !== id).slice(0, 3) ?? []
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (item) document.title = `${item.title} — Loadout`
  }, [item])

  if (isLoading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>
  if (isError) return <div style={{ padding: 40, color: 'var(--muted)' }}>Failed to load content. Please try again.</div>
  if (!item) return <div style={{ padding: 40, color: 'var(--muted)' }}>Content not found.</div>

  function renderInline(text: string) {
    // Split on backticks first; odd-indexed segments are inline code
    const backtickParts = text.split('`')
    if (backtickParts.length === 1) {
      // No backticks — fall through to bold processing
      return renderBoldOnly(text)
    }
    return backtickParts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code key={idx} style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, color: 'var(--orange)' }}>
            {part}
          </code>
        )
      }
      return renderBoldOnly(part, idx)
    })
  }

  function renderBoldOnly(text: string, keyPrefix?: number) {
    const parts = text.split('**')
    if (parts.length === 1) return text
    return parts.map((part, idx) =>
      idx % 2 === 1 ? <strong key={`${keyPrefix ?? ''}-b-${idx}`}>{part}</strong> : part
    )
  }

  // Keep renderBold as an alias so existing call-sites continue to work
  function renderBold(text: string) {
    return renderInline(text)
  }

  const backPath = item.type === 'devlog' ? '/dev-logs' : `/${item.type}s`
  const backLabel = item.type === 'devlog' ? 'Dev Logs' : `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}s`
  const date = new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: isMobile ? 20 : 32, paddingBottom: isMobile ? 40 : 60 }}>
      <Link to={backPath} style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Back to {backLabel}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 48 }}>

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
              {item.views > 0 && <span>{(item.views / 1000).toFixed(1)}k views</span>}
            </div>
          </div>

          {/* Carbon Ad — mobile only; desktop version lives in the sidebar */}
          {isMobile && (
            <div style={{ marginBottom: 24 }}>
              <CarbonAd />
              <GoogleAd />
            </div>
          )}

          {item.thumbnail ? (
            <div style={{ height: 200, borderRadius: 12, backgroundImage: `url(${item.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 32 }} />
          ) : (
            <div style={{ height: 200, borderRadius: 12, background: `linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 32 }}>
              🎮
            </div>
          )}

          {/* Body */}
          <div style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.8 }}>
            {(() => {
              // Pre-process lines into segments: plain text lines and fenced code blocks
              const segments: Array<{ type: 'line'; content: string } | { type: 'code'; content: string }> = []
              let inCode = false
              let codeLines: string[] = []
              for (const line of item.body.split('\n')) {
                if (line.startsWith('```')) {
                  if (inCode) {
                    segments.push({ type: 'code', content: codeLines.join('\n') })
                    codeLines = []
                    inCode = false
                  } else {
                    inCode = true
                  }
                } else if (inCode) {
                  codeLines.push(line)
                } else {
                  segments.push({ type: 'line', content: line })
                }
              }

              return segments.map((segment, i) => {
                if (segment.type === 'code') {
                  return (
                    <pre key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, overflowX: 'auto', fontSize: 13, fontFamily: 'monospace', color: 'var(--sub)', margin: '16px 0', lineHeight: 1.6 }}>
                      <code>{segment.content}</code>
                    </pre>
                  )
                }

                const line = segment.content
                if (line.startsWith('# ')) return <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', margin: '32px 0 16px' }}>{line.slice(2)}</h2>
                if (line.startsWith('## ')) return <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '24px 0 12px' }}>{line.slice(3)}</h3>
                if (line.startsWith('### ')) return <h4 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '20px 0 10px' }}>{line.slice(4)}</h4>
                if (line === '') return <br key={i} />
                if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} style={{ marginBottom: 8, marginLeft: 16 }}>{renderBold('• ' + line.slice(2))}</p>
                if (/^\d+\.\s/.test(line)) return <p key={i} style={{ marginBottom: 8, marginLeft: 16 }}>{renderBold(line)}</p>
                if (line.startsWith('> ')) return (
                  <blockquote key={i} style={{ borderLeft: '3px solid var(--orange)', paddingLeft: 16, margin: '16px 0', color: 'var(--muted)', fontStyle: 'italic' }}>
                    {renderBold(line.slice(2))}
                  </blockquote>
                )
                return <p key={i} style={{ marginBottom: 16 }}>{renderBold(line)}</p>
              })
            })()}
          </div>

          {/* Read full article CTA */}
          {item.sourceUrl && (
            <div style={{ marginTop: 32, padding: 20, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Read the full article</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>This is a preview. The complete article is on Dev.to.</div>
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 7, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(255,92,0,0.3)' }}
              >
                Read on Dev.to ↗
              </a>
            </div>
          )}

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {item.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--muted)' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Recommended Resources */}
          {getAffiliatesForType(item.type).length > 0 && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase' as const,
                color: 'var(--muted)',
                marginBottom: 16,
              }}>
                Recommended Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {getAffiliatesForType(item.type).map(a => (
                  <AffiliateLink
                    key={a.label}
                    label={a.label}
                    description={a.description}
                    href={a.href}
                    cta={a.cta}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Carbon Ad / Google Ad — desktop only; mobile version is above the thumbnail */}
            {!isMobile && <CarbonAd />}
            {!isMobile && <GoogleAd />}

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
                <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5, marginBottom: item.author.twitter || item.author.linkedin ? 12 : 0 }}>{item.author.bio}</p>
                {(item.author.twitter || item.author.linkedin) && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {item.author.twitter && (
                      <a href={`https://twitter.com/${item.author.twitter}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
                        Twitter ↗
                      </a>
                    )}
                    {item.author.linkedin && isSafeUrl(item.author.linkedin) && (
                      <a href={item.author.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                )}
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
