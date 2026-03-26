interface Props {
  label: string
  description: string
  href: string
  cta: string
}

export default function AffiliateLink({ label, description, href, cta }: Props) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {description}
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={{
          padding: '7px 16px',
          fontSize: 12,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          background: 'var(--orange)',
          color: '#fff',
          borderRadius: 7,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 12px rgba(255,92,0,0.25)',
          flexShrink: 0,
        }}
      >
        {cta} ↗
      </a>
    </div>
  )
}
