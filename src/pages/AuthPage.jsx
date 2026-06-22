import { Navigate, useLocation } from 'react-router-dom'
import PageShell from '../components/PageShell'
import PhoneAuth from '../components/auth/PhoneAuth'
import SocialLogins from '../components/auth/SocialLogins'
import { useFirebaseAuth } from '../context/FirebaseAuthContext'

export default function AuthPage() {
  const { currentUser, loading, firebaseAuthEnabled } = useFirebaseAuth()
  const location = useLocation()

  if (!loading && currentUser) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />
  }

  return (
    <PageShell
      eyebrow="Sign in"
      seoTitle="Sign in"
      seoDescription="Sign in to Mettel with Google, Facebook, or your phone number."
      title={<>Sign in</>}
      intro="Tap a logo to continue, or use your mobile number."
    >
      <div className="mx-auto max-w-sm">
        {!firebaseAuthEnabled ? (
          <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">
            Sign-in isn’t configured yet. Add the Firebase keys in .env.
          </p>
        ) : (
          <div className="card-soft space-y-6 p-6">
            <SocialLogins />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35">Or use phone</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            <PhoneAuth />
          </div>
        )}
        {/* Invisible reCAPTCHA mount point for phone auth — see src/lib/firebase.js */}
        <div id="recaptcha-container" />
      </div>
    </PageShell>
  )
}
