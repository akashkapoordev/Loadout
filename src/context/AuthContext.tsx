import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AuthModal from '../components/AuthModal'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isPremium: boolean
  isSubscriptionLoading: boolean
  signOut: () => Promise<void>
  openAuthModal: () => void
  openCheckout: () => Promise<void>
  refreshSubscription: () => Promise<void>
  openCheckoutOrAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const previousSessionRef = useRef<Session | null>(null)

  async function fetchSubscription(userId: string) {
    setIsSubscriptionLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle()
    setIsPremium(!!data)
    setIsSubscriptionLoading(false)
  }

  async function refreshSubscription() {
    if (user) await fetchSubscription(user.id)
  }

  async function openCheckout() {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) return
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.access_token}`,
          },
        }
      )
      if (!res.ok) return
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      // Silently fail — user stays on current page
    }
  }

  function openCheckoutOrAuth() {
    if (user) {
      openCheckout()
    } else {
      sessionStorage.setItem('pendingCheckout', '1')
      setAuthModalOpen(true)
    }
  }

  useEffect(() => {
    // On mount: restore existing session (handles Google OAuth post-redirect)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      previousSessionRef.current = initialSession

      if (initialSession?.user) {
        fetchSubscription(initialSession.user.id)
        // Google OAuth redirect: page reloaded, check pending checkout
        if (sessionStorage.getItem('pendingCheckout')) {
          sessionStorage.removeItem('pendingCheckout')
          openCheckout()
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Fresh email login (not initial session restore or page refresh)
      if (event === 'SIGNED_IN' && newSession && previousSessionRef.current === null) {
        if (sessionStorage.getItem('pendingCheckout')) {
          sessionStorage.removeItem('pendingCheckout')
          openCheckout()
        }
      }

      if (event === 'SIGNED_OUT') {
        setIsPremium(false)
        setIsSubscriptionLoading(false)
      }

      previousSessionRef.current = newSession
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user && event === 'SIGNED_IN') {
        fetchSubscription(newSession.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: AuthContextValue = {
    user, session, isPremium, isSubscriptionLoading,
    signOut: async () => { await supabase.auth.signOut() },
    openAuthModal: () => setAuthModalOpen(true),
    openCheckout,
    refreshSubscription,
    openCheckoutOrAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </AuthContext.Provider>
  )
}
