import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

// Track whether the global AdSense script has been injected (module-level, survives re-renders)
let scriptInjected = false

interface Props {
  hidden?: boolean
}

export default function GoogleAd({ hidden = false }: Props) {
  const insRef = useRef<HTMLElement>(null)
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined
  const adSlot = import.meta.env.VITE_ADSENSE_AD_SLOT as string | undefined

  useEffect(() => {
    if (hidden || !publisherId || !adSlot) return

    if (!scriptInjected) {
      const script = document.createElement('script')
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
      script.async = true
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
      scriptInjected = true
    }

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense script not yet loaded — will activate once script loads
    }
  }, [hidden, publisherId, adSlot])

  if (hidden || !publisherId || !adSlot) return null

  return (
    <ins
      ref={insRef as React.RefObject<HTMLModElement>}
      className="adsbygoogle"
      style={{ display: 'block', marginBottom: 24 }}
      data-ad-client={publisherId}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
