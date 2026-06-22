import { createClient } from '@supabase/supabase-js'
import { firebaseAuth } from './firebase'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Separate client instance — NOT the one in supabaseClient.js. That client
 * carries the app's own Supabase Auth session (used by admin login, wishlist,
 * reviews) and must keep doing so unmodified. This one instead attaches the
 * Firebase ID token as the request's bearer token via the `accessToken`
 * option, so Postgres RLS can read it back via auth.jwt()->>'sub'. Requires
 * Firebase to be added as a Third-Party Auth provider in the Supabase
 * dashboard (Authentication -> Sign In / Providers -> Third-Party Auth) —
 * see supabase/firebase-users.sql for the matching RLS policies.
 */
export const supabaseFirebase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      accessToken: async () => {
        if (!firebaseAuth?.currentUser) return null
        return firebaseAuth.currentUser.getIdToken()
      },
    })
  : null
