import { useEffect, useRef, useState } from 'react'
import { signInWithPhoneNumber } from 'firebase/auth'
import { firebaseAuth, createRecaptchaVerifier } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/firebaseErrors'
import { inputClass, labelClass, Field, Btn } from '../../admin/ui'

const INDIA_PHONE_RE = /^[6-9]\d{9}$/

export default function PhoneAuth() {
  const [step, setStep] = useState('phone') // phone | otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirmationRef = useRef(null)
  const verifierRef = useRef(null)

  useEffect(() => {
    return () => {
      verifierRef.current?.clear()
    }
  }, [])

  const sendOtp = async (e) => {
    e.preventDefault()
    setError('')

    const digits = phone.trim()
    if (!INDIA_PHONE_RE.test(digits)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    setBusy(true)
    try {
      if (!verifierRef.current) {
        verifierRef.current = createRecaptchaVerifier('recaptcha-container')
      }
      const confirmation = await signInWithPhoneNumber(firebaseAuth, `+91${digits}`, verifierRef.current)
      confirmationRef.current = confirmation
      setStep('otp')
    } catch (err) {
      setError(friendlyAuthError(err))
      // A failed send can leave the invisible widget unusable — drop it so
      // the next attempt mounts a fresh one instead of erroring forever.
      verifierRef.current?.clear()
      verifierRef.current = null
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.')
      return
    }

    setBusy(true)
    try {
      await confirmationRef.current.confirm(otp)
      // FirebaseAuthContext picks up the new session via onAuthStateChanged
      // and handles the Supabase sync — nothing else to do here.
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <Field label="OTP" hint={`Sent to +91 ${phone}`}>
          <input
            className={inputClass}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />
        </Field>
        {error ? <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p> : null}
        <Btn variant="flame" type="submit" className="w-full py-3" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify OTP'}
        </Btn>
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setOtp('')
            setError('')
          }}
          className="w-full text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 hover:text-ink"
        >
          ← Change number
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <Field label="Mobile number">
        <div className="flex items-stretch overflow-hidden rounded-xl border border-ink/15 bg-white focus-within:border-flame-500 focus-within:ring-2 focus-within:ring-flame-500/20">
          <span className="flex items-center px-3 font-mono text-sm text-ink/50">+91</span>
          <input
            className="w-full bg-transparent py-2 pr-3 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
          />
        </div>
      </Field>
      {error ? <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p> : null}
      <Btn variant="flame" type="submit" className="w-full py-3" disabled={busy}>
        {busy ? 'Sending…' : 'Send OTP'}
      </Btn>
      <p className={labelClass + ' text-center'}>We’ll text you a 6-digit code</p>
    </form>
  )
}
