/** Product availability helpers, shared by storefront + admin. */

// Sold out when explicitly marked, or when a non-preorder product has no stock.
export function isSoldOut(p) {
  if (!p) return false
  if (p.status === 'soldout') return true
  if (p.status === 'preorder') return false
  return (Number(p.stock) || 0) <= 0
}

// Low (but not zero) stock on a trackable product — used for the admin flag.
export function isLowStock(p, threshold = 5) {
  if (!p || p.status === 'preorder') return false
  const s = Number(p.stock) || 0
  return s > 0 && s <= threshold
}
