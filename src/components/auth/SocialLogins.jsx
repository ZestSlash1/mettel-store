import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { firebaseAuth, googleProvider, facebookProvider } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/firebaseErrors'

/**
 * One-tap logo sign-in. Each button is round, icon-only, and reuses the
 * site's standard `.btn` lift-on-hover treatment (translateY + scale-on-tap,
 * the same house curve as every other CTA) so it doesn't look like a
 * one-off widget bolted onto the page.
 */
export default function SocialLogins() {
  const [busyProvider, setBusyProvider] = useState(null)
  const [error, setError] = useState('')

  const signIn = async (provider, name) => {
    setError('')
    setBusyProvider(name)
    try {
      await signInWithPopup(firebaseAuth, provider)
      // FirebaseAuthContext picks up the new session and syncs Supabase.
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusyProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <LogoButton
          label="Continue with Google"
          busy={busyProvider === 'google'}
          onClick={() => signIn(googleProvider, 'google')}
        >
          <GoogleMark />
        </LogoButton>
        <LogoButton
          label="Continue with Facebook"
          busy={busyProvider === 'facebook'}
          onClick={() => signIn(facebookProvider, 'facebook')}
        >
          <FacebookMark />
        </LogoButton>
      </div>
      {error ? (
        <p className="rounded-xl bg-flame-50 px-3 py-2 text-center font-mono text-[11px] text-flame-700">{error}</p>
      ) : null}
    </div>
  )
}

function LogoButton({ label, busy, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className="btn btn-soft h-16 w-16 !p-0"
    >
      {busy ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-ink/40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-6 w-6" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91A8.77 8.77 0 0 0 17.64 9.2Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.87-3.05.87-2.35 0-4.34-1.58-5.05-3.71H.93v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.72A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.29-1.72V4.95H.93A9 9 0 0 0 0 9c0 1.45.35 2.83.93 4.05l3.02-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A8.5 8.5 0 0 0 9 0 9 9 0 0 0 .93 4.95l3.02 2.33C4.66 5.16 6.65 3.58 9 3.58Z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.89v2.27h3.32l-.53 3.49h-2.79v8.44C19.61 23.08 24 18.09 24 12.07Z" />
    </svg>
  )
}
