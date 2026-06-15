import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPrice } from '../hooks/useProducts'

/**
 * Read-only Orders view. Reads from Supabase through the admin's authenticated
 * session — the "auth read orders" RLS policy (supabase/orders.sql) allows it.
 * Orders are written only by the serverless functions, so there's nothing to
 * edit here.
 */
export default function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null) // order opened in the detail panel

  useEffect(() => {
    let active = true
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (active) {
          setOrders(data ?? [])
          setError('')
        }
      } catch (e) {
        if (active) setError(e.message || 'Could not load orders.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-silver-50 p-8 text-center">
        <p className="font-display text-lg font-black uppercase text-ink/70">Orders need Supabase</p>
        <p className="mx-auto mt-2 max-w-md font-mono text-[11px] text-ink/45">
          Orders are recorded by the checkout serverless functions in your database.
          Connect Supabase (and run <span className="text-flame-700">supabase/orders.sql</span>) to see them here.
        </p>
      </div>
    )
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-silver-200" />

  if (error) {
    return (
      <div className="rounded-2xl border border-flame-700/20 bg-flame-100 p-6 text-center">
        <p className="font-mono text-[12px] text-flame-700">{error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-silver-50 p-8 text-center">
        <p className="font-display text-lg font-black uppercase text-ink/70">No orders yet</p>
        <p className="mt-2 font-mono text-[11px] text-ink/45">Paid orders will appear here, newest first.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const itemCount = Array.isArray(o.items)
                ? o.items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
                : 0
              return (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-silver-50"
                >
                  <Td>
                    <span className="font-mono text-[11px] text-ink/70">{formatDate(o.created_at)}</span>
                  </Td>
                  <Td>
                    <div className="font-mono text-[12px] text-ink">{o.customer_name || '—'}</div>
                    <div className="font-mono text-[10px] text-ink/40">{o.customer_email || ''}</div>
                  </Td>
                  <Td>
                    <span className="font-mono text-[12px] text-ink/70">{itemCount}</span>
                  </Td>
                  <Td>
                    {/* amount is stored in paise → convert to rupees for display */}
                    <span className="font-pixel text-sm text-flame-600">
                      {formatPrice(Math.round((o.amount || 0) / 100), o.currency || 'INR')}
                    </span>
                  </Td>
                  <Td>
                    <StatusChip status={o.status} />
                  </Td>
                  <Td>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink/35">View →</span>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <OrderDetail order={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function OrderDetail({ order, onClose }) {
  return (
    <AnimatePresence>
      {order && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full max-w-md flex-col bg-silver-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-ink/10 px-6 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  Order · {formatDate(order.created_at)}
                </div>
                <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-black uppercase tracking-tight">
                  {formatPrice(Math.round((order.amount || 0) / 100), order.currency || 'INR')}
                  <StatusChip status={order.status} />
                </h2>
              </div>
              <button onClick={onClose} className="text-2xl leading-none text-ink/50 hover:text-ink" aria-label="Close">×</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <Section title="Customer">
                <Line label="Name" value={order.customer_name} />
                <Line label="Email" value={order.customer_email} />
                <Line label="Phone" value={order.customer_phone} />
              </Section>

              <Section title="Ship to">
                {renderAddress(order.shipping_address)}
              </Section>

              <Section title={`Items (${itemTotalQty(order.items)})`}>
                {Array.isArray(order.items) && order.items.length ? (
                  <ul className="space-y-2">
                    {order.items.map((it, i) => (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[12px] text-ink">{it.name || it.id}</div>
                          <div className="font-mono text-[10px] text-ink/40">
                            {formatPrice(Number(it.price) || 0, order.currency || 'INR')} × {it.qty}
                          </div>
                        </div>
                        <span className="shrink-0 font-pixel text-sm text-flame-600">
                          {formatPrice((Number(it.price) || 0) * (Number(it.qty) || 0), order.currency || 'INR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[11px] text-ink/40">No item detail recorded.</p>
                )}
              </Section>

              <Section title="Payment">
                <Line label="Total" value={formatPrice(Math.round((order.amount || 0) / 100), order.currency || 'INR')} />
                <Line label="Razorpay order" value={order.razorpay_order_id} mono />
                <Line label="Razorpay payment" value={order.razorpay_payment_id} mono />
              </Section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5 border-b border-ink/10 pb-5 last:border-0 last:pb-0">
      <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">{title}</div>
      {children}
    </div>
  )
}

function Line({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink/35">{label}</span>
      <span className={`min-w-0 break-words text-right text-[12px] text-ink ${mono ? 'font-mono text-[10px] text-ink/60' : 'font-mono'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function renderAddress(addr) {
  if (!addr) return <p className="font-mono text-[11px] text-ink/40">No address recorded.</p>
  // shipping_address is jsonb: { address, city, state, pincode }
  const a = typeof addr === 'string' ? safeParse(addr) : addr
  if (!a || typeof a !== 'object') {
    return <p className="font-mono text-[12px] text-ink">{String(addr)}</p>
  }
  const cityLine = [a.city, a.state, a.pincode].filter(Boolean).join(', ')
  return (
    <div className="font-mono text-[12px] leading-relaxed text-ink">
      {a.address ? <div>{a.address}</div> : null}
      {cityLine ? <div>{cityLine}</div> : null}
      {!a.address && !cityLine ? (
        <pre className="whitespace-pre-wrap text-[11px] text-ink/60">{JSON.stringify(a, null, 2)}</pre>
      ) : null}
    </div>
  )
}

function safeParse(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

function itemTotalQty(items) {
  return Array.isArray(items) ? items.reduce((n, it) => n + (Number(it.qty) || 0), 0) : 0
}

function StatusChip({ status }) {
  const styles = {
    paid: 'bg-green-100 text-green-700',
    created: 'bg-flame-100 text-flame-700',
    failed: 'bg-ink/10 text-ink/50',
  }
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${styles[status] || styles.created}`}>
      {status || 'created'}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40">{children}</th>
  )
}

function Td({ children }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}
