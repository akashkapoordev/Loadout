import { useNavigate } from 'react-router-dom'
import { useTrending } from '../hooks/useContent'
import ContentTypeBadge from './ContentTypeBadge'

export default function TrendingList() {
  const { data } = useTrending()
  const navigate = useNavigate()
  const items = data?.data ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => {
        const path = item.type === 'devlog'
          ? `/dev-logs/${item.id}`
          : `/${item.type}s/${item.id}`

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(path)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(path)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '12px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--border2)',
              fontFamily: 'var(--mono)',
              lineHeight: 1.2,
              minWidth: 28,
              letterSpacing: '-1px',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 3 }}>
                <ContentTypeBadge type={item.type} />
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.35,
                transition: 'color 0.15s',
              }}>
                {item.title}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
