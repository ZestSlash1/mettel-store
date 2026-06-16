import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/**
 * One Supabase Auth session powers both customers and admins. `isAdmin` comes
 * from the server-side is_admin() function (admins allowlist) — the real
 * security is RLS; this flag just drives the UI (admin panel access).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    const resolve = async (session) => {
      const u = session?.user ?? null
      if (active) setUser(u)
      if (u) {
        try {
          const { data } = await supabase.rpc('is_admin')
          if (active) setIsAdmin(!!data)
        } catch {
          if (active) setIsAdmin(false)
        }
      } else if (active) {
        setIsAdmin(false)
      }
      if (active) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => resolve(session))
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Auth backend not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Auth backend not configured.')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }

  const value = { user, isAdmin, loading, signIn, signUp, signOut, authEnabled: isSupabaseConfigured }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
