import { useState } from 'react'
import PageShell from '../components/PageShell'
import Invoice from '../components/Invoice'
import { formatPrice } from '../hooks/useProducts'
import { statusStyle, statusCopy } from '../lib/orderStatus'
import { inputClass, labelClass, Btn } from '../admin/ui'

export default function Track() {
  const [form, setForm] = useState({ reference: '', email: '' })
  const [result, setResult] = useState(null) // { found, ... }
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, reference: form.reference }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok || !data) throw new Error(data?.error || 'Could not look up your order.')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      eyebrow="Support / Track order"
      seoTitle="Track your order"
      seoDescription="Look up the status of your Mettel order with your order reference and email."
      title={<>Track<br />order</>}
      intro="Enter your order reference (from your confirmation or Razorpay receipt) and the email you used at checkout."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <form data-reveal onSubmit={submit} className="card-soft space-y-4 p-6">
          <label className="block">
            <span className={labelClass}>Order reference</span>
            <input className={inputClass} value={form.reference} onChange={set('reference')} placeholder="order_… or pay_…" required />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="you@email.com" required />
          </label>
          <Btn variant="flame" type="submit" className="w-full" disabled={loading}>
            {loading ? 'Looking up…' : 'Track order'}
          </Btn>
          {error ? (
            <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
          ) : null}
        </form>

        {/* Result */}
        <div data-reveal>
          {result && result.found ? (
            <div className="card-soft p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
                  {result.invoiceNumber || formatDate(result.createdAt)}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${statusStyle(result.status)}`}>
                  {result.status}
                </span>
              </div>
              <p className="mt-3 font-mono text-[12px] leading-relaxed text-ink/70">{statusCopy(result.status)}</p>

              {result.trackingNumber ? (
                <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 font-mono text-[11px] text-blue-700">
                  Tracking: <span className="font-bold">{result.trackingNumber}</span>
                  {result.carrier ? ` · ${result.carrier}` : ''}
                </p>
              ) : null}

              <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 font-mono text-[11px] uppercase tracking-wider">
                <Row k="Name" v={result.customerName} />
                <Row k="Items" v={result.itemCount} />
                <Row k="Total" v={formatPrice(Math.round((result.amount || 0) / 100), result.currency || 'INR')} />
              </dl>

              <div className="mt-5">
                <Btn variant="ghost" type="button" onClick={() => setShowInvoice(true)}>Download invoice</Btn>
              </div>
            </div>
          ) : result && !result.found ? (
            <div className="card-soft p-8 text-center">
              <p className="font-display text-lg font-black uppercase text-ink/70">No match</p>
              <p className="mx-auto mt-2 max-w-xs font-mono text-[11px] text-ink/45">
                We couldn’t find an order for that reference and email. Double-check both, or
                contact us if you need a hand.
              </p>
            </div>
          ) : (
            <div className="rounded-4xl bg-white/50 p-8 text-center ring-1 ring-ink/[0.04]">
              <p className="font-mono text-[11px] text-ink/40">Your order status will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {showInvoice && result?.found ? (
        <Invoice order={result} onClose={() => setShowInvoice(false)} />
      ) : null}
    </PageShell>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink/40">{k}</dt>
      <dd className="text-ink/80">{v ?? '—'}</dd>
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}
