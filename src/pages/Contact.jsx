import { useState } from 'react'
import PageShell from '../components/PageShell'
import { inputClass, labelClass, Btn } from '../admin/ui'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // No mail backend — compose a mailto so the form works today. Swap for a
  // serverless handler (or a form service) when you want inbox-free capture.
  const submit = (e) => {
    e.preventDefault()
    const subject = `Contact from ${form.name || 'a customer'}`
    const body = `${form.message}\n\n— ${form.name}\n${form.email}`
    window.location.href = `mailto:hello@mettel.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <PageShell
      eyebrow="Company / Contact"
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
            We’re a small team in India and reply to most messages within one business day.
          </p>
        </div>

        {/* Form */}
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
          <Btn variant="flame" type="submit" className="w-full">Send message</Btn>
          <p className="text-center font-mono text-[10px] text-ink/35">Opens your email app, pre-filled.</p>
        </form>
      </div>
    </PageShell>
  )
}
