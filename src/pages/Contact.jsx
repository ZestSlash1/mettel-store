import { useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import { inputClass, labelClass, Btn } from '../admin/ui'
import { EASE, DUR, usePrefersReducedMotion } from '../lib/motion'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const reduced = usePrefersReducedMotion()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send message.')
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      eyebrow="Company / Contact"
      seoTitle="Contact"
      seoDescription="Reach the Mettel team about an order, a product, or a partnership."
      title={<>Contact</>}
      intro="Questions about an order, a product, or a partnership? Reach us directly."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Direct channels */}
        <div data-reveal className="space-y-6">
          {[
            ['General', 'hello@mettel.in'],
            ['Support', 'support@mettel.in'],
            ['Returns', 'returns@mettel.in'],
            ['Warranty', 'warranty@mettel.in'],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-ink/[0.06] pb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">{k}</div>
              <a href={`mailto:${v}`} className="font-mono text-sm text-ink transition-colors hover:text-flame-600">
                {v}
              </a>
            </div>
          ))}
          <p className="font-mono text-[11px] leading-relaxed text-ink/50">
            We're a small team in India and reply to most messages within one business day.
          </p>
        </div>

        {/* Form */}
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            className="card-soft flex flex-col items-start gap-3 p-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: reduced ? 0 : -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: reduced ? DUR.fast : DUR.slow, ease: reduced ? EASE.out : EASE.outBack, delay: reduced ? 0 : 0.1 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-flame-500 text-xl text-[#fff]"
            >
              ✓
            </motion.div>
            <p className="font-display text-xl font-black uppercase">Message sent</p>
            <p className="font-mono text-[11px] text-ink/55">We'll get back to you within one business day.</p>
            <button
              onClick={() => { setDone(false); setForm({ name: '', email: '', message: '' }) }}
              className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40 hover:text-ink"
            >
              Send another
            </button>
          </motion.div>
        ) : (
          <form data-reveal onSubmit={submit} className="card-soft space-y-4 p-6">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Your name" required />
            </label>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="you@email.com" required />
            </label>
            <label className="block">
              <span className={labelClass}>Message</span>
              <textarea
                className={`${inputClass} min-h-32 resize-y`}
                value={form.message}
                onChange={set('message')}
                placeholder="How can we help?"
                required
              />
            </label>
            {error ? (
              <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
            ) : null}
            <Btn variant="flame" type="submit" className="w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send message'}
            </Btn>
          </form>
        )}
      </div>
    </PageShell>
  )
}
