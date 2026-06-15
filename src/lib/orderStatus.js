/**
 * Shared order-status vocabulary used by the admin panel, the customer Track
 * page, and the serverless functions. One source of truth for the workflow.
 *
 * created  — order row inserted, payment not yet confirmed
 * paid     — payment verified (set by verify-payment)
 * processing / shipped / delivered — fulfilment stages (set by admin)
 * cancelled / refunded — terminal admin states
 * failed   — payment failed (set by verify-payment)
 */
export const ORDER_STATUSES = [
  'created',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'failed',
]

// Statuses that trigger a customer notification email when set.
export const NOTIFY_STATUSES = ['shipped', 'delivered']

export const STATUS_STYLE = {
  created: 'bg-flame-100 text-flame-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-ink/10 text-ink/50',
  refunded: 'bg-ink/10 text-ink/50',
  failed: 'bg-ink/10 text-ink/50',
}

// Customer-facing one-liners shown on the Track page.
export const STATUS_COPY = {
  created: 'Payment pending or incomplete.',
  paid: 'Paid — we’re preparing your order.',
  processing: 'Being packed and prepared for dispatch.',
  shipped: 'Shipped — on its way to you.',
  delivered: 'Delivered. Thanks for shopping with us.',
  cancelled: 'This order was cancelled.',
  refunded: 'This order was refunded.',
  failed: 'Payment failed — this order was not placed.',
}

export const statusStyle = (s) => STATUS_STYLE[s] || STATUS_STYLE.created
export const statusCopy = (s) => STATUS_COPY[s] || 'Order found.'
