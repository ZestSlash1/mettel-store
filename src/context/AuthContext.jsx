import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/**
 * Wraps Supabase Auth.
 *
 * - If Supabase is configured, tracks the real session and exposes
 *   email/password sign-in + sign-out.
 * - If not configured (local dev), auth is "disabled": there's no backend to
 *   authenticate against, so the admin stays reachable but clearly unprotected.
 *   AuthGate surfaces a warning banner in that case.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Auth backend not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setUser(null)
  }

  const value = { user, loading, signIn, signOut, authEnabled: isSupabaseConfigured }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
