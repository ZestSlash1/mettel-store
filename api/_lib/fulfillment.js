// Shared fulfilment logic for paid orders. Lives under api/_lib so Vercel does
// not treat it as an HTTP endpoint (underscore-prefixed paths are ignored).
//
// fulfillPaidOrder() is the single place that transitions an order to 'paid',
// commits stock, and sends the confirmation email — each exactly once. It is
// called from both verify-payment (browser flow) and razorpay-webhook (server
// flow), so repeated/overlapping calls are safe no-ops.

import { createClient } from '@supabase/supabase-js'

export function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function fulfillPaidOrder(supabase, { razorpayOrderId, paymentId }) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()
  if (error || !order) return { ok: false, reason: 'order_not_found' }

  const patch = { updated_at: new Date().toISOString() }
  if (paymentId) patch.razorpay_payment_id = paymentId
  // Lift created/failed to paid; never downgrade a later fulfilment status.
  if (order.status === 'created' || order.status === 'failed') patch.status = 'paid'

  // Commit stock exactly once.
  if (!order.stock_committed && Array.isArray(order.items) && order.items.length) {
    const items = order.items.map((it) => ({ id: String(it.id), qty: Number(it.qty) || 0 }))
    const { error: decErr } = await supabase.rpc('decrement_stock', { items })
    if (decErr) console.warn('[fulfillment] stock decrement failed:', decErr.message)
    else patch.stock_committed = true
  }

  const { data: updated } = await supabase
    .from('orders')
    .update(patch)
    .eq('razorpay_order_id', razorpayOrderId)
    .select()
    .single()

  const finalOrder = updated || order

  // Send the confirmation email exactly once.
  if (!order.confirmation_sent) {
    const sent = await sendOrderConfirmation(finalOrder)
    if (sent) {
      await supabase.from('orders').update({ confirmation_sent: true }).eq('razorpay_order_id', razorpayOrderId)
    }
  }

  // Notify admin about new order (best-effort, never blocks fulfilment).
  sendAdminNotification(finalOrder).catch(() => {})

  return { ok: true, order: finalOrder }
}

// Mark a payment-failed order, without clobbering an already-paid one.
export async function markOrderFailed(supabase, { razorpayOrderId, paymentId }) {
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()
  if (!order || order.status !== 'created') return
  await supabase
    .from('orders')
    .update({ status: 'failed', razorpay_payment_id: paymentId || null, updated_at: new Date().toISOString() })
    .eq('razorpay_order_id', razorpayOrderId)
}

// Best-effort branded confirmation via Resend REST. Skips silently if email
// isn't configured (RESEND_API_KEY / MAIL_FROM).
async function sendOrderConfirmation(order) {
  const { RESEND_API_KEY, MAIL_FROM, SITE_URL } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM || !order?.customer_email) return false

  const site = SITE_URL || 'https://www.mettel.in'
  const rupees = Math.round((order.amount || 0) / 100)
  const rows = (Array.isArray(order.items) ? order.items : [])
    .map(
      (it) =>
        `<tr><td style="padding:4px 0">${escapeHtml(it.name || it.id)}</td>` +
        `<td style="padding:4px 0;text-align:right">× ${Number(it.qty) || 0}</td></tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:monospace;color:#111;max-width:480px">
      <h2 style="text-transform:uppercase;letter-spacing:1px">Order confirmed</h2>
      <p>Hi ${escapeHtml(order.customer_name || 'there')}, thanks for your order — we’re on it.</p>
      <p style="color:#666">Invoice ${escapeHtml(order.invoice_number || '')}</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">${rows}</table>
      <p style="border-top:1px solid #ddd;padding-top:8px"><strong>Total: ₹${rupees.toLocaleString('en-IN')}</strong></p>
      <p>Track your order anytime at <a href="${site}/track">${site}/track</a>.</p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: order.customer_email,
        subject: `Order confirmed · ${order.invoice_number || 'Mettel'}`,
        html,
      }),
    })
    if (!r.ok) console.warn('[fulfillment] confirmation email failed:', r.status)
    return r.ok
  } catch (e) {
    console.warn('[fulfillment] confirmation email error:', e?.message)
    return false
  }
}

async function sendAdminNotification(order) {
  const { RESEND_API_KEY, MAIL_FROM, ADMIN_EMAIL } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM || !ADMIN_EMAIL) return

  const rupees = Math.round((order.amount || 0) / 100)
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
    : 0

  const html = `
    <div style="font-family:monospace;color:#111;max-width:480px">
      <h2 style="text-transform:uppercase;letter-spacing:1px">New order received</h2>
      <p><strong>${escapeHtml(order.invoice_number || order.razorpay_order_id || '')}</strong></p>
      <p>Customer: ${escapeHtml(order.customer_name || '')} &lt;${escapeHtml(order.customer_email || '')}&gt;</p>
      <p>Items: ${itemCount} · Total: ₹${rupees.toLocaleString('en-IN')}</p>
    </div>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: ADMIN_EMAIL,
        subject: `New order · ${order.invoice_number || ''} · ₹${rupees.toLocaleString('en-IN')}`,
        html,
      }),
    })
  } catch {
    // Admin notification is fire-and-forget.
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}
