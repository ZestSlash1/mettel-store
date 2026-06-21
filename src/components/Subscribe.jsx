import { useState } from 'react'

export default function Subscribe() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscribe', email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="subscribe" className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6">
      <div className="card-soft overflow-hidden p-8 sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="eyebrow mb-3">Newsletter</div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-5xl">
              Drops,<br />first.
            </h2>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink/55">
              Restocks, new arrivals, and the occasional workshop note. No spam — unsubscribe anytime.
            </p>
          </div>

          {done ? (
            <div className="flex items-center gap-3 font-mono text-[12px] text-ink/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-flame-500 text-white">✓</span>
              You're on the list.
            </div>
          ) : (
            <div className="w-full max-w-md">
              <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-full border border-ink/15 bg-white px-5 py-3 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500 focus:ring-2 focus:ring-flame-500/20"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-flame shrink-0 px-6 py-3 text-[12px] tracking-[0.18em]"
                >
                  {busy ? 'Saving…' : 'Subscribe'}
                </button>
              </form>
              {error ? <p className="mt-2 font-mono text-[10px] text-flame-700">{error}</p> : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
