// Vercel Cron Function — GET /api/abandoned-cart-cron
// Schedule: every hour (see vercel.json)
//
// Finds carts abandoned for 1–24 hours, sends a single reminder email,
// then marks them emailed = true so they're never emailed again.
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//               RESEND_API_KEY, MAIL_FROM, SITE_URL (optional)
// Add CRON_SECRET to Vercel env + set Authorization header in Vercel dashboard
// to prevent public invocation.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vercel cron calls with Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized.' })
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, MAIL_FROM, SITE_URL } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !MAIL_FROM) {
    return res.status(500).json({ error: 'Missing env vars.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const site = SITE_URL || 'https://www.mettel.in'

  // Carts abandoned between 1 hour and 24 hours ago, not yet emailed, not converted.
  const now = new Date()
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const { data: carts, error } = await supabase
    .from('carts')
    .select('id, email, items')
    .eq('converted', false)
    .eq('emailed', false)
    .lte('updated_at', oneHourAgo)
    .gte('updated_at', oneDayAgo)
    .limit(50)

  if (error) {
    console.error('[abandoned-cart-cron]', error)
    return res.status(500).json({ error: 'DB error.' })
  }

  let sent = 0
  for (const cart of carts || []) {
    const rows = (Array.isArray(cart.items) ? cart.items : [])
      .map((it) => `<tr><td style="padding:4px 0">${it.name || it.productId}</td><td style="padding:4px 0;text-align:right">× ${it.qty}</td></tr>`)
      .join('')

    const html = `
      <div style="font-family:monospace;color:#111;max-width:480px">
        <h2 style="text-transform:uppercase;letter-spacing:1px">You left something behind</h2>
        <p>Your cart is waiting. Come back and complete your order before it sells out.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0">${rows}</table>
        <a href="${site}" style="display:inline-block;background:#ff6b00;color:#fff;padding:12px 24px;font-family:monospace;text-decoration:none;text-transform:uppercase;letter-spacing:2px;border-radius:24px;margin-top:8px">
          Return to store
        </a>
        <p style="color:#999;font-size:11px;margin-top:16px">
          If you didn't intend to shop, just ignore this email.
        </p>
      </div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: cart.email,
        subject: 'Your cart is waiting for you',
        html,
      }),
    })

    if (r.ok) {
      await supabase.from('carts').update({ emailed: true }).eq('id', cart.id)
      sent++
    } else {
      console.error('[abandoned-cart-cron] email failed for', cart.email)
    }
  }

  return res.status(200).json({ processed: carts?.length || 0, sent })
}
