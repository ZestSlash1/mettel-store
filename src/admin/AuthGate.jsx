import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Field, Btn, inputClass } from './ui'

/**
 * Gates its children behind Supabase Auth.
 *  - authEnabled + signed out  -> login screen
 *  - authEnabled + signed in   -> children
 *  - auth disabled (local dev) -> children, with an "unprotected" banner
 */
export default function AuthGate({ children }) {
  const { user, isAdmin, loading, authEnabled, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-silver font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">
        Checking session…
      </div>
    )
  }

  if (!authEnabled) {
    return (
      <>
        <div className="bg-flame-500 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white">
          Auth disabled · add Supabase keys in .env to protect /admin
        </div>
        {children}
      </>
    )
  }

  if (!user) return <LoginScreen />

  // Signed in but not on the admin allowlist (e.g. a customer account).
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-silver px-4 text-center">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">Staff only</h1>
        <p className="max-w-xs font-mono text-[11px] text-ink/50">
          This area is for MetTel staff. You’re signed in, but this account isn’t an admin.
        </p>
        <div className="flex gap-2">
          <Link to="/" className="rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">Back to store</Link>
          <Btn variant="ghost" onClick={signOut}>Sign out</Btn>
        </div>
      </div>
    )
  }

  return children
}

function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch (e) {
      setError(e?.message || 'Sign-in failed.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-silver px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
            <span className="font-display text-sm font-black">MT</span>
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">Control</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">Staff sign-in</p>
        </div>

        <div className="space-y-4 rounded-3xl bg-silver-50 p-6 ring-1 ring-ink/5">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="you@mettel.in"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••••"
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
          ) : null}

          <Btn variant="flame" onClick={submit} disabled={busy} className="w-full py-3">
            {busy ? 'Signing in…' : 'Sign in'}
          </Btn>

          <p className="text-center font-mono text-[10px] text-ink/35">
            Create users in your Supabase dashboard → Authentication.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50 hover:text-ink">
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}
