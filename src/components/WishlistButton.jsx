import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

/**
 * Heart button that saves/removes a product from the signed-in user's wishlist.
 * If the user isn't signed in, clicking redirects to /account.
 */
export default function WishlistButton({ productId, className = '' }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [user, productId])

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    if (!user || !isSupabaseConfigured) return // caller wraps with a Link to /account

    setBusy(true)
    try {
      if (saved) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
        setSaved(false)
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })
        setSaved(true)
      }
    } finally {
      setBusy(false)
    }
  }

  const baseClass = `flex items-center justify-center rounded-full transition-colors ${className}`

  // Not signed in — render a link to /account instead of a button
  if (!user || !isSupabaseConfigured) {
    return (
      <Link
        to="/account"
        onClick={(e) => e.stopPropagation()}
        className={baseClass}
        aria-label="Sign in to save to wishlist"
        title="Sign in to save"
      >
        <HeartIcon filled={false} />
      </Link>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`${baseClass} ${saved ? 'text-flame-500' : 'text-ink/30 hover:text-flame-500'}`}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={saved ? 'Saved' : 'Save'}
    >
      <HeartIcon filled={saved} />
    </button>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
