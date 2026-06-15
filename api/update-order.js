// Vercel Serverless Function — POST /api/update-order
//
// Admin-only: updates an order's fulfilment fields (status, tracking, carrier,
// internal notes) and, when the status changes to a notifiable state, emails
// the customer. The caller must send a valid Supabase Auth access token
// (Authorization: Bearer <token>) — we verify it server-side, so only signed-in
// admins can write. The DB write uses the service_role key.
//
// Server env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optional (status emails): RESEND_API_KEY, MAIL_FROM, SITE_URL.

import { createClient } from '@supabase/supabase-js'

const NOTIFY_STATUSES = ['shipped', 'delivered']
const ALLOWED_STATUSES = [
  'created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[update-order] missing server env vars')
    res.status(500).json({ error: 'Server is not configured.' })
    return
  }

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      res.status(401).json({ error: 'Not authorized.' })
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Verify the caller is a signed-in (admin) user.
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user) {
      res.status(401).json({ error: 'Not authorized.' })
      return
    }

    const { id, status, tracking_number, carrier, admin_notes } = req.body || {}
    if (!id) {
      res.status(400).json({ error: 'Missing order id.' })
      return
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid status.' })
      return
    }

    // Current status, to detect a real change before emailing.
    const { data: existing } = await supabase
      .from('orders')
      .select('status, customer_email, customer_name, invoice_number')
      .eq('id', id)
      .single()

    const patch = { updated_at: new Date().toISOString() }
    if (status !== undefined) patch.status = status
    if (tracking_number !== undefined) patch.tracking_number = tracking_number || null
    if (carrier !== undefined) patch.carrier = carrier || null
    if (admin_notes !== undefined) patch.admin_notes = admin_notes || null

    const { data: updated, error: updErr } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (updErr) throw updErr

    // Email the customer if the status changed to a notifiable state.
    let emailSent = false
    const statusChanged = status && existing && status !== existing.status
    if (statusChanged && NOTIFY_STATUSES.includes(status)) {
      emailSent = await sendStatusEmail(updated)
    }

    res.status(200).json({ ok: true, order: updated, emailSent })
  } catch (e) {
    console.error('[update-order]', e)
    res.status(500).json({ error: 'Could not update the order.' })
  }
}

// Best-effort status email via Resend's REST API (no SDK dependency).
// Silently skips if RESEND_API_KEY / MAIL_FROM aren't configured.
async function sendStatusEmail(order) {
  const { RESEND_API_KEY, MAIL_FROM, SITE_URL } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM || !order?.customer_email) return false

  const site = SITE_URL || 'https://www.mettel.in'
  const shipped = order.status === 'shipped'
  const subject = shipped
    ? `Your MetTel order has shipped`
    : `Your MetTel order was delivered`
  const trackLine =
    shipped && order.tracking_number
      ? `<p>Tracking: <strong>${order.tracking_number}</strong>${order.carrier ? ` (${order.carrier})` : ''}</p>`
      : ''

  const html = `
    <div style="font-family:monospace;color:#111">
      <h2 style="text-transform:uppercase">${subject}</h2>
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>${shipped ? 'Your order is on its way.' : 'Your order has been delivered. Thanks for shopping with MetTel.'}</p>
      ${trackLine}
      <p>Invoice ${order.invoice_number || ''}. Track anytime at
        <a href="${site}/track">${site}/track</a>.</p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: MAIL_FROM, to: order.customer_email, subject, html }),
    })
    if (!r.ok) {
      console.warn('[update-order] email send failed:', r.status, await r.text())
      return false
    }
    return true
  } catch (e) {
    console.warn('[update-order] email error:', e?.message)
    return false
  }
}
