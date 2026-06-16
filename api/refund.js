import { createClient } from '@supabase/supabase-js'

/**
 * Initiate a Razorpay refund for a paid order.
 * Body: { orderId: <uuid>, amount: <rupees> }  (amount <= total)
 * Requires a valid admin Supabase session in the Authorization header.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorised.' })

  const { orderId, amount } = req.body || {}
  if (!orderId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'orderId and a positive amount (₹) are required.' })
  }

  // Verify admin session.
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session.' })

  const { data: adminCheck } = await supabase.rpc('is_admin')
  if (!adminCheck) return res.status(403).json({ error: 'Admin only.' })

  // Fetch the order to get the Razorpay payment ID.
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('razorpay_payment_id, amount, status')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) return res.status(404).json({ error: 'Order not found.' })
  if (!order.razorpay_payment_id) return res.status(400).json({ error: 'No payment ID on this order — may not have been paid via Razorpay.' })

  const amountPaise = Math.round(Number(amount) * 100)
  if (amountPaise > (order.amount || 0)) {
    return res.status(400).json({ error: `Refund amount (₹${amount}) exceeds order total.` })
  }

  // Call Razorpay refund API.
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay keys not configured.' })
  }

  const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  try {
    const r = await fetch(
      `https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`,
      {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountPaise }),
      },
    )
    const rzpData = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('[refund] Razorpay error:', rzpData)
      return res.status(502).json({ error: rzpData.error?.description || 'Refund failed at Razorpay.' })
    }

    // Update order status to 'refunded'.
    await supabase
      .from('orders')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', orderId)

    return res.status(200).json({ ok: true, refundId: rzpData.id })
  } catch (e) {
    console.error('[refund]', e?.message)
    return res.status(500).json({ error: 'Server error during refund.' })
  }
}
