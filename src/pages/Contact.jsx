import { useState } from 'react'
import PageShell from '../components/PageShell'
import { inputClass, labelClass, Btn } from '../admin/ui'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

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
      seoDescription="Reach the MetTel team about an order, a product, or a partnership."
      title={<>Contact</>}
      intro="Questions about an order, a product, or a partnership? Reach us directly."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Direct channels */}
        <div className="space-y-6">
          {[
            ['General', 'hello@mettel.in'],
            ['Support', 'support@mettel.in'],
            ['Returns', 'returns@mettel.in'],
            ['Warranty', 'warranty@mettel.in'],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-dashed border-ink/15 pb-3">
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
          <div className="flex flex-col items-start gap-3 rounded-3xl bg-white p-8 ring-1 ring-ink/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flame-500 text-xl text-white">✓</div>
            <p className="font-display text-xl font-black uppercase">Message sent</p>
            <p className="font-mono text-[11px] text-ink/55">We'll get back to you within one business day.</p>
            <button
              onClick={() => { setDone(false); setForm({ name: '', email: '', message: '' }) }}
              className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40 hover:text-ink"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
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
