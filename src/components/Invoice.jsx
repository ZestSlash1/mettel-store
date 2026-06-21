import { formatPrice } from '../hooks/useProducts'
import { BUSINESS } from '../config/business'

/**
 * Printable invoice modal, reused by the customer (Track page) and admin.
 * Accepts an order in either shape (camelCase from /api/track-order, or the
 * snake_case DB row in admin) and reads fields defensively. "Save as PDF" uses
 * the browser's print dialog; print CSS (index.css) isolates `.invoice-print`.
 */
export default function Invoice({ order, onClose }) {
  if (!order) return null

  const invoiceNumber = order.invoiceNumber ?? order.invoice_number ?? '—'
  const createdAt = order.createdAt ?? order.created_at
  const name = order.customerName ?? order.customer_name ?? '—'
  const email = order.customerEmail ?? order.customer_email ?? ''
  const phone = order.customerPhone ?? order.customer_phone ?? ''
  const ship = order.shippingAddress ?? order.shipping_address ?? null
  const items = Array.isArray(order.items) ? order.items : []
  const currency = order.currency || 'INR'
  const totalRupees = Math.round((order.amount || 0) / 100)

  return (
    <div className="fixed inset-0 z-[70] flex justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-6 h-fit w-full max-w-2xl">
        {/* Actions (hidden when printing) */}
        <div className="no-print mb-3 flex justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-flame-500 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-flame-600"
          >
            Save as PDF
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink ring-1 ring-ink/15 transition-colors hover:bg-black hover:text-[#fff]"
          >
            Close
          </button>
        </div>

        {/* Invoice sheet */}
        <div className="invoice-print rounded-2xl bg-white p-8 text-ink shadow-2xl sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="font-display text-2xl font-black uppercase tracking-tight">{BUSINESS.name}</div>
              <div className="mt-2 font-mono text-[11px] leading-relaxed text-ink/60">
                {BUSINESS.addressLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
                {BUSINESS.email ? <div>{BUSINESS.email}</div> : null}
                {BUSINESS.phone ? <div>{BUSINESS.phone}</div> : null}
                {BUSINESS.gstin ? <div>GSTIN: {BUSINESS.gstin}</div> : null}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-black uppercase tracking-tight text-flame-600">Invoice</div>
              <div className="mt-2 font-mono text-[11px] text-ink/70">{invoiceNumber}</div>
              <div className="font-mono text-[11px] text-ink/50">{formatDate(createdAt)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/40">Status: {order.status}</div>
            </div>
          </div>

          {/* Bill to */}
          <div className="mt-8 border-t border-ink/10 pt-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Bill to</div>
            <div className="mt-1 font-mono text-[12px] leading-relaxed text-ink/80">
              <div className="text-ink">{name}</div>
              {email ? <div>{email}</div> : null}
              {phone ? <div>{phone}</div> : null}
              {renderAddress(ship)}
            </div>
          </div>

          {/* Items */}
          <table className="mt-6 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/40">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-ink/5 font-mono text-[12px]">
                  <td className="py-2.5">{it.name || it.id}</td>
                  <td className="py-2.5 text-center text-ink/70">{it.qty}</td>
                  <td className="py-2.5 text-right text-ink/70">{formatPrice(Number(it.price) || 0, currency)}</td>
                  <td className="py-2.5 text-right">{formatPrice((Number(it.price) || 0) * (Number(it.qty) || 0), currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-[240px] space-y-2">
              <div className="flex items-center justify-between border-t-2 border-ink pt-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">Total</span>
                <span className="font-display text-xl font-black">{formatPrice(totalRupees, currency)}</span>
              </div>
            </div>
          </div>

          <p className="mt-8 border-t border-ink/10 pt-4 font-mono text-[10px] leading-relaxed text-ink/40">
            Thank you for your order. This is a computer-generated invoice from {BUSINESS.website || BUSINESS.name}.
          </p>
        </div>
      </div>
    </div>
  )
}

function renderAddress(a) {
  if (!a || typeof a !== 'object') return null
  const cityLine = [a.city, a.state, a.pincode].filter(Boolean).join(', ')
  return (
    <>
      {a.address ? <div>{a.address}</div> : null}
      {cityLine ? <div>{cityLine}</div> : null}
    </>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ts
  }
}
