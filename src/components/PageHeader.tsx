interface Props {
  title: string
  action?: React.ReactNode
}

export default function PageHeader({ title, action }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    }}>
      <div style={{
        fontSize: 13,
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--sub)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          display: 'block',
          width: 3,
          height: 16,
          background: 'var(--orange)',
          borderRadius: 2,
        }} />
        {title}
      </div>
      {action}
    </div>
  )
}
