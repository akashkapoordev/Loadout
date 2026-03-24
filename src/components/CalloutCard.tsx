interface Props {
  icon?: string
  title: string
  description: string
  buttonLabel: string
  onClick?: () => void
}

export default function CalloutCard({ icon = '🎯', title, description, buttonLabel, onClick }: Props) {
  return (
    <div style={{
      border: '1px solid var(--accent-mid)',
      borderRadius: 12,
      background: 'var(--accent-dim)',
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5, marginBottom: 16 }}>{description}</div>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: 10,
          background: 'var(--orange)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 0 16px rgba(255,92,0,0.3)',
          transition: 'all 0.15s',
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
