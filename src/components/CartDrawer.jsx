import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useProducts, formatPrice } from '../hooks/useProducts'
import { getSetting, subscribe } from '../lib/dataStore'
import ProductGraphic from './ProductGraphic'
import { EASE, DUR, STAGGER, usePrefersReducedMotion } from '../lib/motion'

/** Reads the admin-editable free-shipping threshold (rupees); null = feature off. */
function useFreeShippingThreshold() {
  const [threshold, setThreshold] = useState(null)

  useEffect(() => {
    let active = true
    const load = () => {
      getSetting('free_shipping_threshold').then((v) => {
        if (!active) return
        const n = Number(v)
        setThreshold(Number.isFinite(n) && n > 0 ? n : null)
      })
    }
    load()
    const unsub = subscribe(load) // pick up admin edits without a reload
    return () => {
      active = false
      unsub()
    }
  }, [])

  return threshold
}

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

/**
 * POST JSON and parse the response defensively. The serverless endpoints can
 * return an empty body (e.g. a 404 when /api isn't served, or a crashed 500),
 * which would make res.json() throw a cryptic "Unexpected end of JSON input".
 * Read as text first and turn any non-JSON / error response into a clear message.
 */
async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      /* non-JSON body (e.g. an HTML error page) */
    }
  }
  if (!res.ok || data === null) {
    if (data?.error) throw new Error(data.error)
    if (res.status === 404) {
      throw new Error('Checkout API not found — run the app with `vercel dev` (plain `npm run dev` does not serve /api).')
    }
    throw new Error(`Checkout failed (HTTP ${res.status}). Please try again.`)
  }
  return data
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, addItem, subtotal, count, clear } = useCart()
  const { products } = useProducts()
  const [placed, setPlaced] = useState(false)
  const [orderRef, setOrderRef] = useState('') // reference shown on confirmation
  const [checkingOut, setCheckingOut] = useState(false) // showing the address form
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coupon, setCoupon] = useState('') // code being typed
  const [couponMsg, setCouponMsg] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0) // rupees off (preview)
  const [couponOk, setCouponOk] = useState(false)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('razorpay') // 'razorpay' | 'cod'
  const freeShippingThreshold = useFreeShippingThreshold()

  const { user } = useAuth()
  const reduced = usePrefersReducedMotion()
  const currency = items[0]?.currency || 'INR'
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const total = Math.max(0, subtotal - couponDiscount)

  // "Complete the kit" — admin-curated related_ids from items in the bag,
  // topped up with same-category suggestions when there aren't enough.
  const crossSell = useMemo(() => {
    if (!items.length || !products.length) return []
    const inCart = new Set(items.map((l) => l.productId))
    const curatedIds = []
    items.forEach((l) => {
      const p = products.find((pp) => pp.id === l.productId)
      p?.related_ids?.forEach((rid) => {
        if (!inCart.has(rid) && !curatedIds.includes(rid)) curatedIds.push(rid)
      })
    })
    let picks = curatedIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)
    if (picks.length < 4) {
      const cartCats = new Set(items.map((l) => products.find((p) => p.id === l.productId)?.category_id).filter(Boolean))
      const fallback = products.filter((p) => cartCats.has(p.category_id) && !inCart.has(p.id) && !picks.some((x) => x.id === p.id))
      picks = [...picks, ...fallback]
    }
    return picks.slice(0, 4)
  }, [items, products])

  const quickAdd = (p) => addItem(p, { model: p.models?.[0] ?? null })

  // Prefill the checkout email from the signed-in account so the order links
  // to it (and shows up in their order history).
  useEffect(() => {
    if (checkingOut && user?.email) {
      setForm((f) => (f.email ? f : { ...f, email: user.email }))
    }
  }, [checkingOut, user])

  const resetCheckout = () => {
    setCheckingOut(false)
    setLoading(false)
    setError('')
    setPaymentMethod('razorpay')
  }

  const codOrder = async () => {
    setError('')
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      setError('Please fill in name, email, phone, address, city and PIN code.')
      return
    }
    setLoading(true)
    try {
      const data = await postJSON('/api/cod-order', {
        items: items.map((l) => ({ id: l.productId, qty: l.qty })),
        customer: { name: form.name, email: form.email, phone: form.phone },
        shipping: { address: form.address, city: form.city, state: form.state, pincode: form.pincode },
        couponCode: couponOk ? coupon.trim().toUpperCase() : undefined,
      })
      setOrderRef(data.orderId || '')
      setPlaced(true)
      setCheckingOut(false)
      setForm(emptyForm)
      setLoading(false)
      clear()
      if (form.email) fetch('/api/lifecycle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sync-cart', email: form.email, items: [], convert: true }) }).catch(() => {})
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Preview a coupon: server recomputes the discount from DB prices.
  const applyCoupon = async () => {
    setCouponMsg('')
    if (!coupon.trim()) return
    setApplyingCoupon(true)
    try {
      const data = await postJSON('/api/validate-coupon', {
        code: coupon,
        items: items.map((l) => ({ id: l.productId, qty: l.qty })),
      })
      setCouponOk(!!data.valid)
      setCouponDiscount(data.valid ? data.discountRupees || 0 : 0)
      setCouponMsg(data.message || (data.valid ? 'Applied.' : 'Invalid code.'))
    } catch (e) {
      setCouponOk(false)
      setCouponDiscount(0)
      setCouponMsg(e.message)
    } finally {
      setApplyingCoupon(false)
    }
  }

  // Close the drawer and clear the post-payment confirmation state.
  const dismiss = () => {
    setPlaced(false)
    setOrderRef('')
    closeCart()
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
      const data = await postJSON('/api/create-order', {
        items: items.map((l) => ({ id: l.productId, qty: l.qty })),
        customer: { name: form.name, email: form.email, phone: form.phone },
        shipping: {
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        couponCode: couponOk ? coupon.trim().toUpperCase() : undefined,
      })

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
            const vd = await postJSON('/api/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            if (!vd.verified) throw new Error(vd.error || 'Payment could not be verified.')

            // Verified — clear the bag and show the confirmation (with a
            // reference the customer can use to track the order). The
            // confirmation stays up until they dismiss it.
            setOrderRef(response.razorpay_payment_id || response.razorpay_order_id || '')
            setPlaced(true)
            setCheckingOut(false)
            setForm(emptyForm)
            setLoading(false)
            clear()
            // Mark cart converted so abandoned-cart cron skips this email.
            if (form.email) fetch('/api/lifecycle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sync-cart', email: form.email, items: [], convert: true }) }).catch(() => {})
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
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={dismiss} />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: DUR.base, ease: EASE.out }}
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
              <motion.button
                onClick={dismiss}
                whileHover={reduced ? undefined : { rotate: 90, scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="text-2xl leading-none text-ink/50 hover:text-ink"
                aria-label="Close cart"
              >
                ×
              </motion.button>
            </div>

            {!placed && items.length > 0 ? (
              <FreeShippingBar subtotal={subtotal} threshold={freeShippingThreshold} reduced={reduced} />
            ) : null}

            {/* Body */}
            <AnimatePresence mode="wait" initial={false}>
            {placed ? (
              <motion.div
                key="placed"
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: reduced ? 0 : -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: reduced ? DUR.fast : DUR.slow, ease: reduced ? EASE.out : EASE.outBack, delay: reduced ? 0 : 0.1 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-500 text-2xl text-white"
                >
                  ✓
                </motion.div>
                <p className="font-display text-xl font-black uppercase">Order confirmed</p>
                <p className="max-w-xs font-mono text-[11px] text-ink/50">
                  {paymentMethod === 'cod'
                    ? 'Your order is placed. Pay in cash when it arrives.'
                    : 'Payment received. A receipt is on its way to your email.'}
                </p>
                {orderRef ? (
                  <p className="font-mono text-[10px] text-ink/40">
                    Reference: <span className="text-ink/70">{orderRef}</span>
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    to="/track"
                    onClick={dismiss}
                    className="btn rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500"
                  >
                    Track order
                  </Link>
                  <button
                    onClick={dismiss}
                    className="btn rounded-full bg-silver-200 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-white"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : items.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center"
              >
                <p className="font-display text-xl font-black uppercase text-ink/70">Bag is empty</p>
                <p className="font-mono text-[11px] text-ink/40">Add something to get started.</p>
                <button onClick={dismiss} className="btn mt-3 rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
                  Keep browsing
                </button>
              </motion.div>
            ) : checkingOut ? (
              /* ---- Checkout form ---- */
              <motion.div
                key="checkout"
                data-lenis-prevent
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="flex-1 overflow-y-auto px-6 py-4"
              >
                <div className="space-y-3">
                  <CheckoutField label="Full name" value={form.name} onChange={setField('name')} placeholder="Aarav Sharma" autoComplete="name" />
                  <CheckoutField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="you@email.com"
                    autoComplete="email"
                    onBlur={() => {
                      if (!form.email.includes('@') || items.length === 0) return
                      fetch('/api/lifecycle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'sync-cart', email: form.email.trim(), items: items.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty })) }),
                      }).catch(() => {})
                    }}
                  />
                  <CheckoutField label="Phone" type="tel" value={form.phone} onChange={setField('phone')} placeholder="98xxxxxxxx" autoComplete="tel" />
                  <CheckoutField label="Address" value={form.address} onChange={setField('address')} placeholder="House / street / area" autoComplete="street-address" />
                  <div className="grid grid-cols-2 gap-3">
                    <CheckoutField label="City" value={form.city} onChange={setField('city')} placeholder="Mumbai" autoComplete="address-level2" />
                    <CheckoutField label="State" value={form.state} onChange={setField('state')} placeholder="MH" autoComplete="address-level1" />
                  </div>
                  <CheckoutField label="PIN code" value={form.pincode} onChange={setField('pincode')} placeholder="400001" autoComplete="postal-code" />
                </div>

                {/* Payment method */}
                <div className="mt-4">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">Payment</span>
                  <div className="flex gap-2">
                    {[['razorpay', 'Pay online'], ['cod', 'Cash on delivery']].map(([method, label]) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`relative flex-1 overflow-hidden rounded-xl border py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                          paymentMethod === method
                            ? 'border-flame-500 text-flame-700'
                            : 'border-ink/15 bg-white text-ink/60 hover:border-ink/30'
                        }`}
                      >
                        {paymentMethod === method ? (
                          <motion.span
                            layoutId="paymentActive"
                            transition={{ duration: reduced ? 0 : DUR.fast, ease: EASE.out }}
                            className="absolute inset-0 -z-10 bg-flame-500/10"
                          />
                        ) : null}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-4">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">Coupon code</span>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponOk(false); setCouponDiscount(0); setCouponMsg('') }}
                      placeholder="WELCOME10"
                      className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-sm uppercase text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !coupon.trim()}
                      className="shrink-0 rounded-xl bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-500 disabled:opacity-40"
                    >
                      {applyingCoupon ? '…' : 'Apply'}
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {couponMsg ? (
                      <motion.p
                        key={couponMsg}
                        initial={{ opacity: 0, y: reduced ? 0 : -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: DUR.fast, ease: EASE.out }}
                        className={`mt-1 font-mono text-[10px] ${couponOk ? 'text-green-700' : 'text-flame-700'}`}
                      >
                        {couponMsg}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>

                <AnimatePresence initial={false}>
                  {error ? (
                    <motion.p
                      key={error}
                      initial={{ opacity: 0, y: reduced ? 0 : -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: DUR.fast, ease: EASE.out }}
                      className="mt-4 rounded-xl bg-flame-100 px-3 py-2 font-mono text-[11px] text-flame-700"
                    >
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ---- Cart line items ---- */
              <motion.div
                key="items"
                data-lenis-prevent
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="flex-1 overflow-y-auto px-6 py-4"
              >
                <ul className="space-y-4">
                  <AnimatePresence initial={false} mode="popLayout">
                  {items.map((l, i) => (
                    <motion.li
                      key={l.lineId}
                      layout
                      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE.out, delay: reduced ? 0 : i * STAGGER.tight } }}
                      exit={{ opacity: 0, x: reduced ? 0 : 24, transition: { duration: DUR.fast, ease: EASE.out } }}
                      className="flex gap-4 border-b border-ink/10 pb-4 last:border-0"
                    >
                      <div className="w-14 shrink-0">
                        {l.image ? (
                          <img src={l.image} alt="" className="h-auto w-full" />
                        ) : (
                          <ProductGraphic className="h-auto w-full" shell={l.color_hex} accent={l.accent_hex} />
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
                    </motion.li>
                  ))}
                  </AnimatePresence>
                </ul>

                {crossSell.length ? (
                  <div className="mt-6 border-t border-ink/10 pt-4">
                    <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">Complete the kit</h3>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {crossSell.map((p) => (
                        <div key={p.id} className="flex w-28 shrink-0 flex-col gap-1.5 rounded-xl bg-white p-2 ring-1 ring-ink/5">
                          <Link to={`/product/${p.id}`} onClick={closeCart} className="block">
                            <div className="aspect-square w-full overflow-hidden rounded-lg bg-silver-50">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
                              ) : (
                                <ProductGraphic className="h-full w-full" shell={p.color_hex} accent={p.accent_hex} />
                              )}
                            </div>
                            <div className="mt-1.5 truncate font-mono text-[10px] uppercase text-ink/70">{p.name}</div>
                          </Link>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-flame-600">{formatPrice(p.price, p.currency)}</span>
                            <button
                              onClick={() => quickAdd(p)}
                              aria-label={`Add ${p.name} to bag`}
                              className="rounded-full bg-ink px-2 py-1 font-mono text-[9px] uppercase text-white hover:bg-flame-500"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
            </AnimatePresence>

            {/* Footer */}
            {!placed && items.length > 0 ? (
              <div className="border-t border-ink/10 px-6 py-5">
                <AnimatePresence initial={false}>
                  {checkingOut && couponOk && couponDiscount > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DUR.fast, ease: EASE.out }}
                      className="mb-2 flex items-center justify-between font-mono text-[11px]"
                    >
                      <span className="uppercase tracking-[0.16em] text-ink/45">Discount {coupon.trim().toUpperCase()}</span>
                      <span className="text-green-700">− {formatPrice(couponDiscount, currency)}</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">
                    {checkingOut ? 'Total' : 'Subtotal'}
                  </span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={checkingOut ? total : subtotal}
                      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduced ? 0 : -6 }}
                      transition={{ duration: DUR.fast, ease: EASE.out }}
                      className="font-display text-2xl font-black"
                    >
                      {formatPrice(checkingOut ? total : subtotal, currency)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Trust signals */}
                <div className="mb-3 flex items-center justify-center gap-4 rounded-xl bg-white/60 px-3 py-2 ring-1 ring-ink/5">
                  <TrustBadge icon={<LockIcon />} text="Secure checkout" />
                  <TrustBadge icon={<ReturnIcon />} text="30-day returns" />
                  <TrustBadge icon={<ShieldIcon />} text="Razorpay" />
                </div>

                {checkingOut ? (
                  <>
                    <button
                      onClick={paymentMethod === 'cod' ? codOrder : pay}
                      disabled={loading}
                      className="btn btn-flame w-full py-3.5 text-[12px] tracking-[0.18em]"
                    >
                      {loading
                        ? 'Processing…'
                        : paymentMethod === 'cod'
                          ? `Place order · Pay on delivery`
                          : `Pay ${formatPrice(total, currency)}`}
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
                    <p className="mb-4 font-mono text-[10px] text-ink/40">Shipping calculated at checkout.</p>
                    <button
                      onClick={() => { setError(''); setCheckingOut(true) }}
                      className="btn btn-flame w-full py-3.5 text-[12px] tracking-[0.18em]"
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

/** "₹X away from free shipping" — unlocks once the subtotal clears the admin-set threshold. */
function FreeShippingBar({ subtotal, threshold, reduced }) {
  if (!threshold) return null // feature off (no value set in admin)

  const pct = Math.min(100, Math.round((subtotal / threshold) * 100))
  const unlocked = subtotal >= threshold
  const remaining = Math.max(0, threshold - subtotal)

  return (
    <div className="border-b border-ink/10 bg-white/60 px-6 py-3">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={unlocked ? 'unlocked' : remaining}
          initial={{ opacity: 0, y: reduced ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
          className={`mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${unlocked ? 'text-green-700' : 'text-ink/55'}`}
        >
          {unlocked ? 'Free shipping unlocked ✓' : `${formatPrice(remaining)} away from free shipping`}
        </motion.p>
      </AnimatePresence>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
        <motion.div
          className={`h-full rounded-full ${unlocked ? 'bg-green-600' : 'bg-flame-500'}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.out }}
        />
      </div>
    </div>
  )
}

function CheckoutField({ label, type = 'text', value, onChange, onBlur, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500 focus:ring-2 focus:ring-flame-500/20"
      />
    </label>
  )
}

function Stepper({ onClick, label }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: DUR.fast, ease: EASE.out }}
      className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-base text-ink/70 hover:bg-ink hover:text-white"
      aria-label={label === '+' ? 'Increase' : 'Decrease'}
    >
      {label}
    </motion.button>
  )
}

function TrustBadge({ icon, text }) {
  return (
    <div className="flex items-center gap-1 text-ink/50">
      <span className="text-ink/40">{icon}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{text}</span>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
