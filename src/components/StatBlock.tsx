interface Props {
  value: string | number
  label: string
}

export default function StatBlock({ value, label }: Props) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      textAlign: 'right',
    }}>
      <div style={{
        fontSize: 28,
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        letterSpacing: '-1px',
        color: 'var(--text)',
        lineHeight: 1,
        marginBottom: 2,
      }}>
        <span style={{ color: 'var(--orange)' }}>{value}</span>
      </div>
      <div style={{
        fontSize: 11,
        fontFamily: 'var(--font-ui)',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontWeight: 700,
      }}>
        {label}
      </div>
    </div>
  )
}
