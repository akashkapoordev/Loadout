import { useSearchParams } from 'react-router-dom'
import { useContentInfinite } from '../hooks/useContent'
import { useBreakpoint } from '../hooks/useBreakpoint'
import ContentCard from '../components/ContentCard'
import type { ContentType } from '../lib/types'

const typeConfig = {
  tutorial: {
    title: 'TUTORIALS',
    description: 'Step-by-step guides from industry veterans covering engines, tools, and techniques.',
    tags: ['unreal-engine', 'unity', 'godot', 'c++', 'shaders', 'vfx', 'procedural', 'ai'],
  },
  article: {
    title: 'ARTICLES',
    description: 'Industry insights, career advice, and analysis of what\'s shaping games today.',
    tags: ['industry', 'career', 'culture', 'ai', 'indie', 'narrative', 'business'],
  },
  devlog: {
    title: 'DEV LOGS',
    description: 'Developers sharing the real journey of building games, week by week.',
    tags: ['indie', 'unity', 'devlog', 'solo-dev', 'design', 'shaders', 'gameplay'],
  },
  guide: {
    title: 'GUIDES',
    description: 'Deep-dive career and technical guides to help you level up in the industry.',
    tags: ['career', 'portfolio', 'salary', 'hiring', 'beginner', 'leadership'],
  },
}

interface Props {
  type: ContentType
}

export default function ContentListPage({ type }: Props) {
  const config = typeConfig[type]
  const [params, setParams] = useSearchParams()
  const { isMobile, isTablet } = useBreakpoint()

  const sort = (params.get('sort') ?? 'latest') as 'latest' | 'most-viewed' | 'top-rated'
  const tagsParam = params.get('tags') ?? ''
  const activeTags = tagsParam ? tagsParam.split(',') : []

  function setSort(value: 'latest' | 'most-viewed' | 'top-rated') {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('sort', value)
      return next
    }, { replace: true })
  }

  function toggleTag(tag: string) {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      const current = (next.get('tags') ?? '').split(',').filter(Boolean)
      const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
      if (updated.length > 0) next.set('tags', updated.join(','))
      else next.delete('tags')
      return next
    }, { replace: true })
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError } = useContentInfinite({
    type,
    tags: activeTags.length > 0 ? activeTags : undefined,
    sort,
  })

  const items = data?.pages.flatMap(p => p.data) ?? []

  return (
    <div style={{ paddingInline: isMobile ? 20 : 40, paddingTop: 32, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 6 }}>
          {config.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>{config.description}</p>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {config.tags.map(tag => {
            const active = activeTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 12px', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 600,
                  borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  border: `1px solid ${active ? 'var(--orange)' : 'var(--border2)'}`,
                  background: active ? 'var(--accent-dim)' : 'var(--surface)',
                  color: active ? 'var(--orange)' : 'var(--sub)',
                }}
              >
                #{tag}
              </button>
            )
          })}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'latest' | 'most-viewed' | 'top-rated')}
          style={{ padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 600, background: 'var(--surface)', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer' }}
        >
          <option value="latest">Latest</option>
          <option value="most-viewed">Most Viewed</option>
          <option value="top-rated">Top Rated</option>
        </select>
      </div>

      {/* Content area: loading / error / results */}
      {isError ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Failed to load content. Please try again.</div>
      ) : !data ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <>
          {/* Featured */}
          {items.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <ContentCard item={items[0]} featured />
            </div>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {items.slice(1).map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>No content found.</div>
          )}
        </>
      )}

      {hasNextPage && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ padding: '10px 32px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'var(--surface)', color: 'var(--sub)', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer' }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
