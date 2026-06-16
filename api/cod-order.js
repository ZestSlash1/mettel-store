// Vercel Serverless Function — POST /api/cod-order
//
// Creates a Cash-on-Delivery order: records it in Supabase with
// payment_method = 'cod', status = 'pending', no Razorpay involvement.
// Amount is always recomputed from DB prices — never trusted from client.

import { createClient } from '@supabase/supabase-js'
import { evaluateCoupon } from './_lib/coupons.js'

async function sendCodConfirmation(order) {
  const { RESEND_API_KEY, MAIL_FROM } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM || !order?.customer_email) return
  const rupees = Math.round((order.amount || 0) / 100)
  const rows = (order.items || []).map((it) => `<tr><td>${it.name || it.id}</td><td>× ${it.qty}</td></tr>`).join('')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: order.customer_email,
      subject: `Order confirmed — pay on delivery · ${order.invoice_number}`,
      html: `<div style="font-family:monospace;max-width:480px">
        <h2>Order confirmed</h2>
        <p>Hi ${order.customer_name || 'there'}, your order is placed — pay in cash when it arrives.</p>
        <p style="color:#666">Invoice ${order.invoice_number}</p>
        <table style="width:100%">${rows}</table>
        <p><strong>Total: ₹${rupees.toLocaleString('en-IN')}</strong></p>
      </div>`,
    }),
  }).catch(() => {})
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured.' })
  }

  const { items, customer, shipping, couponCode } = req.body || {}

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty.' })
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ error: 'Name, email and phone are required.' })
  }

  const qtyById = new Map()
  for (const line of items) {
    const id = String(line?.id ?? '').trim()
    const qty = Math.max(0, parseInt(line?.qty, 10) || 0)
    if (id && qty > 0) qtyById.set(id, (qtyById.get(id) || 0) + qty)
  }
  if (qtyById.size === 0) return res.status(400).json({ error: 'No valid items.' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price, currency, stock, status')
    .in('id', [...qtyById.keys()])
  if (prodErr) return res.status(500).json({ error: 'Could not load products.' })

  const unavailable = []
  for (const p of products) {
    const qty = qtyById.get(p.id) || 0
    if (p.status === 'soldout') unavailable.push(`${p.name} (sold out)`)
    else if (p.status !== 'preorder' && (Number(p.stock) || 0) < qty) {
      unavailable.push(`${p.name} (only ${Number(p.stock) || 0} left)`)
    }
  }
  if (unavailable.length) return res.status(409).json({ error: `Some items are unavailable: ${unavailable.join(', ')}.` })

  let amountPaise = 0
  let currency = 'INR'
  const orderItems = []
  for (const p of products) {
    const qty = qtyById.get(p.id)
    if (!qty) continue
    amountPaise += Math.round(Number(p.price) * 100) * qty
    currency = p.currency || currency
    orderItems.push({ id: p.id, name: p.name, price: p.price, qty })
  }

  if (amountPaise <= 0) return res.status(400).json({ error: 'Order total must be greater than zero.' })

  let discountPaise = 0
  let appliedCoupon = null
  if (couponCode) {
    const result = await evaluateCoupon(supabase, { code: couponCode, subtotalRupees: amountPaise / 100 })
    if (!result.valid) return res.status(400).json({ error: result.message || 'Coupon could not be applied.' })
    discountPaise = result.discountPaise
    appliedCoupon = result.code
  }
  const finalAmount = Math.max(0, amountPaise - discountPaise)

  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const invoiceNumber = `MT-${ymd}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const orderId = `cod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const { error: insErr } = await supabase.from('orders').insert({
    id: orderId,
    status: 'pending',
    payment_method: 'cod',
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
    stock_committed: false,
  })
  if (insErr) {
    console.error('[cod-order] insert error', insErr)
    return res.status(500).json({ error: 'Could not create order.' })
  }

  if (appliedCoupon) {
    await supabase.rpc('increment_coupon_use', { p_code: appliedCoupon }).catch(() => {})
  }

  // Deduct stock for COD orders immediately (same as paid orders).
  for (const item of orderItems) {
    await supabase.rpc('decrement_stock', { p_id: item.id, p_qty: item.qty }).catch(() => {})
  }

  // Send confirmation email (fire-and-forget).
  const fullOrder = {
    id: orderId,
    invoice_number: invoiceNumber,
    customer_name: customer.name,
    customer_email: customer.email,
    items: orderItems,
    amount: finalAmount,
    currency,
    payment_method: 'cod',
  }
  sendCodConfirmation(fullOrder).catch(() => {})

  return res.status(200).json({ ok: true, orderId: invoiceNumber })
}
