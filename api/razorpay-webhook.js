// Vercel Serverless Function — POST /api/razorpay-webhook
//
// Server-to-server payment confirmation. If a customer pays but never returns
// to the browser (closed tab, lost connection), the verify-payment call never
// fires — but Razorpay still calls this webhook, so the order is reliably
// marked paid (and stock committed / email sent) via the shared fulfilment
// helper. Idempotent with verify-payment.
//
// Setup: Razorpay Dashboard → Settings → Webhooks → add
//   URL:    https://www.mettel.in/api/razorpay-webhook
//   Events: payment.captured, order.paid, payment.failed
//   Secret: set the same value as RAZORPAY_WEBHOOK_SECRET (env).
//
// Server env: RAZORPAY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import crypto from 'crypto'
import { adminClient, fulfillPaidOrder, markOrderFailed } from './_lib/fulfillment.js'

// Razorpay signs the RAW request body — we must verify against the exact bytes,
// so disable Vercel's automatic JSON body parsing for this route.
export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { RAZORPAY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!RAZORPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[razorpay-webhook] missing server env vars')
    res.status(500).json({ error: 'Webhook not configured.' })
    return
  }

  try {
    const raw = await readRawBody(req)
    const signature = req.headers['x-razorpay-signature'] || ''
    const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex')

    const a = Buffer.from(expected)
    const b = Buffer.from(String(signature))
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b)
    if (!valid) {
      res.status(400).json({ error: 'Invalid signature.' })
      return
    }

    const event = JSON.parse(raw.toString('utf8'))
    const supabase = adminClient()

    // Pull the Razorpay order id + payment id out of whichever event shape.
    const payment = event?.payload?.payment?.entity
    const orderEntity = event?.payload?.order?.entity
    const razorpayOrderId = payment?.order_id || orderEntity?.id || null
    const paymentId = payment?.id || null

    if (razorpayOrderId) {
      if (event.event === 'payment.failed') {
        await markOrderFailed(supabase, { razorpayOrderId, paymentId })
      } else if (event.event === 'payment.captured' || event.event === 'order.paid') {
        await fulfillPaidOrder(supabase, { razorpayOrderId, paymentId })
      }
    }

    // Always 200 quickly so Razorpay doesn't retry a handled event.
    res.status(200).json({ received: true })
  } catch (e) {
    console.error('[razorpay-webhook]', e)
    res.status(500).json({ error: 'Webhook handler error.' })
  }
}
