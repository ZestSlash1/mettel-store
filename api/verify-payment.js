// Vercel Serverless Function — POST /api/verify-payment
//
// Verifies the Razorpay payment signature server-side and, only on success,
// marks the matching order 'paid'. An invalid signature can NEVER mark an
// order paid — it records 'failed' and returns an error.
//
// Razorpay signs `${order_id}|${payment_id}` with HMAC-SHA256 using the key
// secret. We recompute it and compare in constant time.
//
// Server-only env (no VITE_ prefix):
//   RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import crypto from 'crypto'
import { adminClient, fulfillPaidOrder, markOrderFailed } from './_lib/fulfillment.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[verify-payment] missing server env vars')
    res.status(500).json({ verified: false, error: 'Payment is not configured on the server.' })
    return
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ verified: false, error: 'Missing payment fields.' })
      return
    }

    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // Constant-time compare (guard length first — timingSafeEqual throws on mismatch).
    const expectedBuf = Buffer.from(expected)
    const givenBuf = Buffer.from(String(razorpay_signature))
    const valid =
      expectedBuf.length === givenBuf.length &&
      crypto.timingSafeEqual(expectedBuf, givenBuf)

    const supabase = adminClient()

    if (!valid) {
      // Record the failure but never mark it paid.
      await markOrderFailed(supabase, { razorpayOrderId: razorpay_order_id, paymentId: razorpay_payment_id })
      res.status(400).json({ verified: false, error: 'Signature verification failed.' })
      return
    }

    // Mark paid + commit stock + email — idempotent, shared with the webhook.
    const result = await fulfillPaidOrder(supabase, {
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    })
    if (!result.ok) throw new Error(result.reason || 'fulfilment failed')

    res.status(200).json({ verified: true })
  } catch (e) {
    console.error('[verify-payment]', e)
    res.status(500).json({ verified: false, error: 'Could not verify payment.' })
  }
}
