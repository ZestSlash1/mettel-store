// Vercel Serverless Function — POST /api/lifecycle
//
// Combines three small, low-stakes, no-auth endpoints (newsletter subscribe,
// back-in-stock notify, abandoned-cart sync) into one function, routed by
// `type`. Vercel's Hobby plan caps a deployment at 12 functions; this project
// otherwise sits at 14. None of these touch payments or orders, so merging
// them is the lowest-risk way to get under the limit.

import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type } = req.body || {}
  if (type === 'subscribe') return subscribe(req, res)
  if (type === 'notify-stock') return notifyStock(req, res)
  if (type === 'sync-cart') return syncCart(req, res)
  return res.status(400).json({ error: 'Unknown type.' })
}

async function subscribe(req, res) {
  const { email } = req.body || {}
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  // Upsert so re-subscribing the same email is idempotent.
  const { error } = await supabase
    .from('subscribers')
    .upsert({ email: email.trim().toLowerCase(), active: true }, { onConflict: 'email', ignoreDuplicates: false })

  if (error) {
    console.error('[lifecycle/subscribe]', error)
    return res.status(500).json({ error: 'Could not save. Please try again.' })
  }

  // Best-effort welcome email via Resend.
  const { RESEND_API_KEY, MAIL_FROM, SITE_URL } = process.env
  if (RESEND_API_KEY && MAIL_FROM) {
    const site = SITE_URL || 'https://www.mettel.in'
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: email.trim(),
        subject: 'You\'re on the list — MetTel',
        html: `
          <div style="font-family:monospace;color:#111;max-width:480px">
            <h2 style="text-transform:uppercase;letter-spacing:1px">You're on the list.</h2>
            <p>Thanks for subscribing. You'll hear from us when new products drop, when things restock, and occasionally when something interesting happens in the workshop.</p>
            <p>No spam. Unsubscribe at any time by replying to this email.</p>
            <p style="color:#888">— MetTel</p>
            <p><a href="${site}">${site}</a></p>
          </div>`,
      }),
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}

async function notifyStock(req, res) {
  const { productId, email } = req.body || {}
  if (!productId || !email) return res.status(400).json({ error: 'productId and email are required.' })
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { error } = await supabase
    .from('stock_notifications')
    .upsert(
      { product_id: productId, email: email.trim().toLowerCase() },
      { onConflict: 'product_id,email', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[lifecycle/notify-stock]', error)
    return res.status(500).json({ error: 'Could not save. Please try again.' })
  }

  return res.status(200).json({ ok: true })
}

// Called when the customer types their email in the checkout form (on blur).
// Upserts a cart row so the abandoned-cart cron can follow up if they don't pay.
// Requires no auth — only email + cart items, which are public data at this point.
async function syncCart(req, res) {
  const { email, items, convert } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email is required.' })

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  if (convert) {
    // Mark as converted so the cron skips it.
    await supabase.from('carts').update({ converted: true }).eq('email', email).eq('converted', false)
    return res.status(200).json({ ok: true })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required when not converting.' })
  }

  const { error } = await supabase.from('carts').upsert(
    { email, items, converted: false, emailed: false, updated_at: new Date().toISOString() },
    { onConflict: 'email', ignoreDuplicates: false },
  )

  if (error) {
    console.error('[lifecycle/sync-cart]', error)
    return res.status(500).json({ error: 'Could not save cart.' })
  }

  return res.status(200).json({ ok: true })
}
