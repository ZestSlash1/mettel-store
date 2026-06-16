// Vercel Serverless Function — POST /api/create-order
//
// Creates a Razorpay order from the cart and records a pending row in Supabase.
//
// SECURITY: the amount is ALWAYS recomputed here from the database prices.
// We never trust a total (or per-item price) sent by the client. The body only
// supplies which products and how many; we look up the real price ourselves.
//
// Server-only env (no VITE_ prefix — never reaches the browser):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { evaluateCoupon } from './_lib/coupons.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const {
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[create-order] missing server env vars')
    res.status(500).json({ error: 'Payment is not configured on the server.' })
    return
  }

  try {
    const { items, customer, shipping, couponCode } = req.body || {}

    // ---- validate input ----
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' })
      return
    }
    if (!customer?.name || !customer?.email || !customer?.phone) {
      res.status(400).json({ error: 'Name, email and phone are required.' })
      return
    }

    // Collapse the cart into a qty-per-product map (ignores any client price).
    const qtyById = new Map()
    for (const line of items) {
      const id = String(line?.id ?? '').trim()
      const qty = Math.max(0, parseInt(line?.qty, 10) || 0)
      if (!id || qty < 1) continue
      qtyById.set(id, (qtyById.get(id) || 0) + qty)
    }
    const ids = [...qtyById.keys()]
    if (ids.length === 0) {
      res.status(400).json({ error: 'No valid items in the cart.' })
      return
    }

    // service_role client — bypasses RLS, used only on the server.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // ---- recompute the total from real DB prices ----
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, currency, stock, status')
      .in('id', ids)
    if (prodErr) throw prodErr
    if (!products || products.length === 0) {
      res.status(400).json({ error: 'Items could not be found.' })
      return
    }

    // ---- enforce availability (no overselling) ----
    // Sold-out products are blocked; available products must have enough stock.
    // Preorder items are allowed regardless of stock.
    const unavailable = []
    for (const p of products) {
      const qty = qtyById.get(p.id) || 0
      if (p.status === 'soldout') unavailable.push(`${p.name} (sold out)`)
      else if (p.status !== 'preorder' && (Number(p.stock) || 0) < qty) {
        unavailable.push(`${p.name} (only ${Number(p.stock) || 0} left)`)
      }
    }
    if (unavailable.length) {
      res.status(409).json({ error: `Some items are unavailable: ${unavailable.join(', ')}.` })
      return
    }

    let amountPaise = 0
    let currency = 'INR'
    const orderItems = []
    for (const p of products) {
      const qty = qtyById.get(p.id)
      if (!qty) continue
      const linePaise = Math.round(Number(p.price) * 100) * qty // rupees → paise
      amountPaise += linePaise
      currency = p.currency || currency
      orderItems.push({ id: p.id, name: p.name, price: p.price, qty })
    }

    if (amountPaise <= 0) {
      res.status(400).json({ error: 'Order total must be greater than zero.' })
      return
    }

    // ---- apply coupon server-side (authoritative; client can't forge it) ----
    let discountPaise = 0
    let appliedCoupon = null
    if (couponCode) {
      const result = await evaluateCoupon(supabase, { code: couponCode, subtotalRupees: amountPaise / 100 })
      if (!result.valid) {
        res.status(400).json({ error: result.message || 'That coupon could not be applied.' })
        return
      }
      discountPaise = result.discountPaise
      appliedCoupon = result.code
    }
    const finalAmount = Math.max(100, amountPaise - discountPaise)

    // ---- create the Razorpay order ----
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    const rzpOrder = await razorpay.orders.create({
      amount: finalAmount,
      currency,
      receipt: `rcpt_${Date.now()}`,
    })

    // Invoice number assigned at order time (e.g. MT-20260616-AB12CD).
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const invoiceNumber = `MT-${ymd}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // ---- record a pending order ----
    const { error: insErr } = await supabase.from('orders').insert({
      razorpay_order_id: rzpOrder.id,
      status: 'created',
      amount: finalAmount,
      currency,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: shipping || null,
      items: orderItems,
      invoice_number: invoiceNumber,
      coupon_code: appliedCoupon,
      discount: discountPaise,
    })
    if (insErr) throw insErr

    // Count the redemption (best-effort).
    if (appliedCoupon) {
      await supabase.rpc('increment_coupon_use', { p_code: appliedCoupon }).catch(() => {})
    }

    // keyId is the PUBLIC Razorpay key — safe to return to the browser.
    res.status(200).json({
      razorpayOrderId: rzpOrder.id,
      amount: finalAmount,
      currency,
      keyId: RAZORPAY_KEY_ID,
      discount: discountPaise,
      couponCode: appliedCoupon,
    })
  } catch (e) {
    console.error('[create-order]', e)
    res.status(500).json({ error: 'Could not start checkout. Please try again.' })
  }
}
