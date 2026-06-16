export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, message } = req.body || {}
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  const { RESEND_API_KEY, MAIL_FROM, ADMIN_EMAIL } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM || !ADMIN_EMAIL) {
    // Soft-fail if email is not configured (e.g. local dev).
    return res.status(200).json({ ok: true, note: 'Email not configured.' })
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  const html = `
    <div style="font-family:monospace;color:#111;max-width:480px">
      <h2 style="text-transform:uppercase;letter-spacing:1px">New contact message</h2>
      <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:12px 0" />
      <p style="white-space:pre-wrap">${esc(message)}</p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: ADMIN_EMAIL,
        reply_to: email.trim(),
        subject: `Contact: ${name.trim()}`,
        html,
      }),
    })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      console.error('[contact] email failed:', r.status, body)
      return res.status(502).json({ error: 'Could not send message. Try emailing us directly.' })
    }
  } catch (e) {
    console.error('[contact]', e?.message)
    return res.status(500).json({ error: 'Server error. Try emailing us directly.' })
  }

  return res.status(200).json({ ok: true })
}
