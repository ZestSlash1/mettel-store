import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../hooks/useProducts'
import PhoneCase from './PhoneCase'

const RZP_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const emptyForm = { name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' }

/** Inject the Razorpay Checkout script once; resolves false if it can't load. */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = RZP_SCRIPT
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotal, count, clear } = useCart()
  const [placed, setPlaced] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false) // showing the address form
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currency = items[0]?.currency || 'INR'
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const resetCheckout = () => {
    setCheckingOut(false)
    setLoading(false)
    setError('')
  }

  // Real checkout: server creates the order (recomputing the total), Razorpay
  // collects payment, then the server verifies the signature before we clear.
  const pay = async () => {
    setError('')
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      setError('Please fill in name, email, phone, address, city and PIN code.')
      return
    }
    setLoading(true)
    try {
      // 1. Create the order server-side (amount is computed from DB prices).
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((l) => ({ id: l.productId, qty: l.qty })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: {
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.')

      // 2. Load the gateway and open Checkout.
      const ok = await loadRazorpay()
      if (!ok) throw new Error('Could not load the payment gateway. Check your connection.')

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        name: 'MetTel',
        description: 'mettel.in order',
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#ff6b00' },
        // 3. On payment success, verify the signature server-side.
        handler: async (response) => {
          setLoading(true)
          try {
            const vr = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const vd = await vr.json()
            if (!vr.ok || !vd.verified) throw new Error(vd.error || 'Payment could not be verified.')

            // Verified — show confirmation and clear the bag.
            setPlaced(true)
            setCheckingOut(false)
            setForm(emptyForm)
            setLoading(false)
            setTimeout(() => {
              clear()
              setPlaced(false)
              closeCart()
            }, 2200)
          } catch (err) {
            setError(err.message)
            setLoading(false)
          }
        },
        modal: {
          // User closed Razorpay without paying — keep the cart, re-enable the button.
          ondismiss: () => setLoading(false),
        },
      })
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed. Please try again.')
        setLoading(false)
      })
      rzp.open()
      setLoading(false) // modal is open; let the user interact
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeCart} />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full max-w-md flex-col bg-silver-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  {checkingOut ? 'Checkout' : 'Your bag'}
                </div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">
                  {checkingOut ? 'Shipping details' : `${count} ${count === 1 ? 'item' : 'items'}`}
                </h2>
              </div>
              <button onClick={closeCart} className="text-2xl leading-none text-ink/50 hover:text-ink" aria-label="Close cart">×</button>
            </div>

            {/* Body */}
            {placed ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-500 text-2xl text-white">✓</div>
                <p className="font-display text-xl font-black uppercase">Payment received</p>
                <p className="max-w-xs font-mono text-[11px] text-ink/50">
                  Your order is confirmed. A receipt is on its way to your email.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-display text-xl font-black uppercase text-ink/70">Bag is empty</p>
                <p className="font-mono text-[11px] text-ink/40">Add a case to get started.</p>
                <button onClick={closeCart} className="mt-3 rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
                  Keep browsing
                </button>
              </div>
            ) : checkingOut ? (
              /* ---- Checkout form ---- */
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-3">
                  <CheckoutField label="Full name" value={form.name} onChange={setField('name')} placeholder="Aarav Sharma" autoComplete="name" />
                  <CheckoutField label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="you@email.com" autoComplete="email" />
                  <CheckoutField label="Phone" type="tel" value={form.phone} onChange={setField('phone')} placeholder="98xxxxxxxx" autoComplete="tel" />
                  <CheckoutField label="Address" value={form.address} onChange={setField('address')} placeholder="House / street / area" autoComplete="street-address" />
                  <div className="grid grid-cols-2 gap-3">
                    <CheckoutField label="City" value={form.city} onChange={setField('city')} placeholder="Mumbai" autoComplete="address-level2" />
                    <CheckoutField label="State" value={form.state} onChange={setField('state')} placeholder="MH" autoComplete="address-level1" />
                  </div>
                  <CheckoutField label="PIN code" value={form.pincode} onChange={setField('pincode')} placeholder="400001" autoComplete="postal-code" />
                </div>
                {error ? (
                  <p className="mt-4 rounded-xl bg-flame-100 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
                ) : null}
              </div>
            ) : (
              /* ---- Cart line items ---- */
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <ul className="space-y-4">
                  {items.map((l) => (
                    <li key={l.lineId} className="flex gap-4 border-b border-ink/10 pb-4 last:border-0">
                      <div className="w-14 shrink-0">
                        {l.image ? (
                          <img src={l.image} alt="" className="h-auto w-full" />
                        ) : (
                          <PhoneCase className="h-auto w-full" shell={l.color_hex} accent={l.accent_hex} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-display text-sm font-black uppercase">{l.name}</div>
                            {l.model ? <div className="font-mono text-[10px] text-ink/45">{l.model}</div> : null}
                            <div className="font-mono text-[10px] text-ink/35">{l.sku}</div>
                          </div>
                          <button onClick={() => removeItem(l.lineId)} className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink/40 hover:text-flame-700">
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full bg-white ring-1 ring-ink/10">
                            <Stepper onClick={() => updateQty(l.lineId, l.qty - 1)} label="−" />
                            <span className="w-7 text-center font-mono text-sm">{l.qty}</span>
                            <Stepper onClick={() => updateQty(l.lineId, l.qty + 1)} label="+" />
                          </div>
                          <span className="font-pixel text-sm text-flame-600">{formatPrice(l.price * l.qty, l.currency)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            {!placed && items.length > 0 ? (
              <div className="border-t border-ink/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">
                    {checkingOut ? 'Total' : 'Subtotal'}
                  </span>
                  <span className="font-display text-2xl font-black">{formatPrice(subtotal, currency)}</span>
                </div>

                {checkingOut ? (
                  <>
                    <button
                      onClick={pay}
                      disabled={loading}
                      className="w-full rounded-full bg-flame-500 py-3.5 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Processing…' : `Pay ${formatPrice(subtotal, currency)}`}
                    </button>
                    <button
                      onClick={resetCheckout}
                      disabled={loading}
                      className="mt-2 w-full rounded-full py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50 transition-colors hover:text-ink disabled:opacity-50"
                    >
                      ← Back to bag
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 font-mono text-[10px] text-ink/40">Shipping & taxes calculated at checkout.</p>
                    <button
                      onClick={() => { setError(''); setCheckingOut(true) }}
                      className="w-full rounded-full bg-flame-500 py-3.5 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600"
                    >
                      Checkout
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CheckoutField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500 focus:ring-2 focus:ring-flame-500/20"
      />
    </label>
  )
}

function Stepper({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-base text-ink/70 hover:bg-ink hover:text-white" aria-label={label === '+' ? 'Increase' : 'Decrease'}>
      {label}
    </button>
  )
}
