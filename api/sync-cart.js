// Vercel Serverless Function — POST /api/sync-cart
//
// Called when the customer types their email in the checkout form (on blur).
// Upserts a cart row so the abandoned-cart cron can follow up if they don't pay.
// Requires no auth — only email + cart items, which are public data at this point.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
    console.error('[sync-cart]', error)
    return res.status(500).json({ error: 'Could not save cart.' })
  }

  return res.status(200).json({ ok: true })
}
