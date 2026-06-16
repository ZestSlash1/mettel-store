import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    console.error('[subscribe]', error)
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
