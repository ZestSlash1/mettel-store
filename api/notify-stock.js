import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { productId, email } = req.body || {}
  if (!productId || !email) return res.status(400).json({ error: 'productId and email are required.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    console.error('[notify-stock]', error)
    return res.status(500).json({ error: 'Could not save. Please try again.' })
  }

  return res.status(200).json({ ok: true })
}
