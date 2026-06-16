// Vercel Serverless Function — POST /api/validate-coupon
//
// Previews a coupon for the cart: recomputes the subtotal from DB prices (never
// trusts the client) and returns the discount, so the cart can show it before
// checkout. create-order re-validates and applies it authoritatively.
//
// Server env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'
import { evaluateCoupon } from './_lib/coupons.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ valid: false, message: 'Coupons are not configured.' })
    return
  }

  try {
    const { code, items } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ valid: false, message: 'Your cart is empty.' })
      return
    }

    const qtyById = new Map()
    for (const line of items) {
      const id = String(line?.id ?? '').trim()
      const qty = Math.max(0, parseInt(line?.qty, 10) || 0)
      if (id && qty) qtyById.set(id, (qtyById.get(id) || 0) + qty)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: products } = await supabase.from('products').select('id, price').in('id', [...qtyById.keys()])
    let subtotalRupees = 0
    for (const p of products || []) subtotalRupees += (Number(p.price) || 0) * (qtyById.get(p.id) || 0)

    const result = await evaluateCoupon(supabase, { code, subtotalRupees })
    res.status(200).json({
      valid: result.valid,
      code: result.code || null,
      discountRupees: result.discountRupees || 0,
      message: result.message,
    })
  } catch (e) {
    console.error('[validate-coupon]', e)
    res.status(500).json({ valid: false, message: 'Could not check that code.' })
  }
}
