import { useState } from 'react'

/**
 * Newsletter band on the home page. Gives the nav "Subscribe" pill (#subscribe)
 * a real target. No mailing-list backend yet — submitting shows a confirmation
 * and would be wired to a provider (or a serverless handler) later.
 */
export default function Subscribe() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!email) return
    setDone(true)
  }

  return (
    <section id="subscribe" className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl bg-silver-50 p-8 ring-1 ring-ink/5 sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="eyebrow mb-3">Newsletter</div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-5xl">
              Drops,<br />first.
            </h2>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink/55">
              Restocks, new devices, and the occasional workshop note. No spam — unsubscribe anytime.
            </p>
          </div>

          {done ? (
            <div className="flex items-center gap-3 font-mono text-[12px] text-ink/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-flame-500 text-white">✓</span>
              You’re on the list.
            </div>
          ) : (
            <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
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
                className="shrink-0 rounded-full bg-flame-500 px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
