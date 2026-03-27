import { useEffect, useRef } from 'react'

interface Props {
  hidden?: boolean
}

export default function CarbonAd({ hidden = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const serve = import.meta.env.VITE_CARBON_ADS_SERVE as string | undefined

  useEffect(() => {
    if (hidden || !serve || !containerRef.current) return

    const script = document.createElement('script')
    script.src = serve
    script.id = '_carbonads_js'
    script.async = true
    containerRef.current.appendChild(script)

    return () => {
      script.remove()
      document.getElementById('carbonads')?.remove()
    }
  }, [hidden, serve])

  if (hidden || !serve) return null

  return <div ref={containerRef} style={{ marginBottom: 24 }} />
}
