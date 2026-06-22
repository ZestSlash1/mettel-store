import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, RecaptchaVerifier } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

export const firebaseApp = isFirebaseConfigured ? initializeApp(config) : null
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null

export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Lazily created per mount point (the invisible reCAPTCHA widget needs a live
// DOM node — see #recaptcha-container in AuthPage). Firebase reuses an
// existing verifier on the same container, so callers should clear it on unmount.
export function createRecaptchaVerifier(containerId = 'recaptcha-container') {
  if (!firebaseAuth) throw new Error('Firebase is not configured.')
  return new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' })
}
