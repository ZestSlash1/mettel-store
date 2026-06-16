import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../hooks/useProducts'
import { statusStyle, statusCopy } from '../lib/orderStatus'
import { inputClass, labelClass, Btn } from '../admin/ui'
import WishlistButton from '../components/WishlistButton'

export default function Account() {
  const { user, authEnabled } = useAuth()

  return (
    <PageShell
      eyebrow="Account"
      seoTitle="Your account"
      seoDescription="Sign in to MetTel to view your orders."
      title={<>Account</>}
      intro={user ? 'Your orders and details.' : 'Sign in or create an account to track your orders.'}
    >
      {!authEnabled ? (
        <p className="font-mono text-[12px] text-ink/50">Accounts need Supabase to be configured.</p>
      ) : user ? (
        <SignedIn />
      ) : (
        <AuthForm />
      )}
    </PageShell>
  )
}

function SignedIn() {
  const { user, signOut } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    let active = true
    supabase
      .from('orders')
      .select('status, created_at, amount, currency, items, invoice_number, tracking_number')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setOrders(data ?? [])
          setLoading(false)
        }
      })

    // Load wishlist with basic product info (product_id only; we join manually).
    supabase
      .from('wishlists')
      .select('product_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setWishlist(data ?? [])
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">Signed in as</div>
          <div className="font-mono text-sm text-ink">{user.email}</div>
        </div>
        <Btn variant="ghost" onClick={signOut}>Sign out</Btn>
      </div>

      <div>
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Your orders</div>
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-silver-200" />
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center">
            <p className="font-mono text-[11px] text-ink/45">
              No orders yet. Orders placed with <span className="text-ink/70">{user.email}</span> will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o, i) => (
              <li key={i} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-ink/60">{o.invoice_number || formatDate(o.created_at)}</span>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${statusStyle(o.status)}`}>{o.status}</span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-ink/55">{statusCopy(o.status)}</p>
                {o.tracking_number ? (
                  <p className="mt-1 font-mono text-[10px] text-blue-700">Tracking: {o.tracking_number}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-ink/45">{itemCount(o.items)} item(s)</span>
                  <span className="font-pixel text-sm text-flame-600">{formatPrice(Math.round((o.amount || 0) / 100), o.currency || 'INR')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Wishlist */}
      <div>
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Saved items</div>
        {wishlist.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center">
            <p className="font-mono text-[11px] text-ink/45">
              No saved items yet. Tap the heart on any product to save it.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {wishlist.map((w) => (
              <li key={w.product_id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                <Link to={`/product/${w.product_id}`} className="font-mono text-[12px] text-ink hover:text-flame-600">
                  {w.product_id}
                </Link>
                <WishlistButton productId={w.product_id} className="h-8 w-8 text-flame-500" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
        setNotice('Account created. If email confirmation is on, check your inbox, then sign in.')
        setMode('signin')
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4 flex gap-2">
        <Toggle active={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</Toggle>
        <Toggle active={mode === 'signup'} onClick={() => setMode('signup')}>Create account</Toggle>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <label className="block">
          <span className={labelClass}>Email</span>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
        </label>
        <label className="block">
          <span className={labelClass}>Password</span>
          <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </label>
        {error ? <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p> : null}
        {notice ? <p className="rounded-xl bg-green-50 px-3 py-2 font-mono text-[11px] text-green-700">{notice}</p> : null}
        <Btn variant="flame" type="submit" className="w-full py-3" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Btn>
      </form>
      <p className="mt-4 text-center font-mono text-[10px] text-ink/35">
        Staff? The admin panel is at <Link to="/admin" className="text-ink/60 hover:text-flame-600">/admin</Link>.
      </p>
    </div>
  )
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex-1 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
        active ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
      }`}
    >
      {children}
    </button>
  )
}

function itemCount(items) {
  return Array.isArray(items) ? items.reduce((n, it) => n + (Number(it.qty) || 0), 0) : 0
}
function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ts
  }
}
