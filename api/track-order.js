// Vercel Serverless Function — POST /api/track-order
//
// Lets a customer look up their own order status. They must supply BOTH the
// order reference (Razorpay order id `order_…` or payment id `pay_…`, shown on
// the confirmation / Razorpay receipt) AND the email used at checkout. Requiring
// the email match prevents enumerating other people's orders by guessing ids.
//
// Reads with the service_role key (the orders table's RLS allows only
// authenticated reads); we constrain the query so only the matching order
// returns. Server-only env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[track-order] missing server env vars')
    res.status(500).json({ error: 'Order tracking is not configured on the server.' })
    return
  }

  try {
    const { email, reference } = req.body || {}
    if (!email || !reference) {
      res.status(400).json({ error: 'Enter your email and order reference.' })
      return
    }

    const ref = String(reference).trim()
    // Razorpay ids are alphanumeric + underscore. Reject anything else so the
    // value is safe to interpolate into the PostgREST or() filter.
    if (!/^[A-Za-z0-9_]+$/.test(ref)) {
      res.status(400).json({ found: false })
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('orders')
      .select(
        'status, created_at, amount, currency, items, customer_name, customer_email, customer_phone, shipping_address, tracking_number, carrier, invoice_number',
      )
      .ilike('customer_email', String(email).trim())
      .or(`razorpay_order_id.eq.${ref},razorpay_payment_id.eq.${ref}`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error

    const order = data?.[0]
    if (!order) {
      res.status(200).json({ found: false })
      return
    }

    const itemCount = Array.isArray(order.items)
      ? order.items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
      : 0

    // The requester proved ownership (email + reference), so return the full
    // order — the Track page renders both a status summary and the invoice.
    res.status(200).json({
      found: true,
      status: order.status,
      createdAt: order.created_at,
      amount: order.amount,
      currency: order.currency,
      itemCount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address || null,
      items: Array.isArray(order.items) ? order.items : [],
      trackingNumber: order.tracking_number || null,
      carrier: order.carrier || null,
      invoiceNumber: order.invoice_number || null,
    })
  } catch (e) {
    console.error('[track-order]', e)
    res.status(500).json({ error: 'Could not look up your order. Please try again.' })
  }
}
