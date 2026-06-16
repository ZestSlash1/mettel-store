// Shared coupon evaluation, used by both validate-coupon (preview) and
// create-order (authoritative apply). Under api/_lib so it isn't a route.

export async function evaluateCoupon(supabase, { code, subtotalRupees }) {
  const norm = String(code || '').trim().toUpperCase()
  if (!norm) return { valid: false, message: 'Enter a code.' }

  const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', norm).single()
  if (error || !coupon) return { valid: false, message: 'Invalid code.' }
  if (!coupon.active) return { valid: false, message: 'This code is no longer active.' }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: 'This code has expired.' }
  }
  if (coupon.usage_limit != null && (coupon.used_count || 0) >= coupon.usage_limit) {
    return { valid: false, message: 'This code has reached its usage limit.' }
  }
  const subtotal = Math.max(0, Math.round(Number(subtotalRupees) || 0))
  if (subtotal < (coupon.min_subtotal || 0)) {
    return { valid: false, message: `Spend at least ₹${coupon.min_subtotal} to use this code.` }
  }

  let discountRupees =
    coupon.type === 'percent'
      ? Math.floor((subtotal * Math.min(100, Math.max(0, coupon.value))) / 100)
      : Math.min(Math.max(0, coupon.value), subtotal)

  // Always leave at least ₹1 payable (Razorpay minimum).
  discountRupees = Math.max(0, Math.min(discountRupees, subtotal - 1))

  return {
    valid: true,
    code: norm,
    coupon,
    discountRupees,
    discountPaise: discountRupees * 100,
    message: 'Coupon applied.',
  }
}
