import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase'
import { supabaseFirebase, isSupabaseConfigured } from '../lib/supabaseFirebaseClient'

const FirebaseAuthContext = createContext(null)

/**
 * Separate from src/context/AuthContext.jsx (Supabase Auth — staff/admin
 * login, wishlist, reviews; untouched). This one is for the customer-facing
 * phone OTP / Google login, with Firebase as the identity provider and a
 * dedicated `users` row in Supabase mirroring it for app data.
 */
export function FirebaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [supabaseUser, setSupabaseUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    let active = true

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!active) return
      setCurrentUser(user)

      if (user && isSupabaseConfigured) {
        try {
          const row = await syncSupabaseUser(user)
          if (active) setSupabaseUser(row)
        } catch {
          if (active) setSupabaseUser(null)
        }
      } else {
        setSupabaseUser(null)
      }

      if (active) setLoading(false)
    })

    return () => {
      active = false
      unsub()
    }
  }, [])

  const signOut = async () => {
    if (isFirebaseConfigured) await firebaseSignOut(firebaseAuth)
    setCurrentUser(null)
    setSupabaseUser(null)
  }

  const value = { currentUser, supabaseUser, loading, signOut, firebaseAuthEnabled: isFirebaseConfigured }
  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>
}

async function syncSupabaseUser(user) {
  // Forces a fresh ID token so accessToken() in supabaseFirebaseClient.js
  // has a non-expired JWT for the RLS check on this same request.
  await user.getIdToken(true)

  const { data, error } = await supabaseFirebase
    .from('users')
    .upsert(
      {
        firebase_uid: user.uid,
        phone: user.phoneNumber || null,
        email: user.email || null,
        display_name: user.displayName || null,
        photo_url: user.photoURL || null,
        last_login: new Date().toISOString(),
      },
      { onConflict: 'firebase_uid' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext)
  if (!ctx) throw new Error('useFirebaseAuth must be used within <FirebaseAuthProvider>')
  return ctx
}
