import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPrice } from '../hooks/useProducts'
import { ORDER_STATUSES, statusStyle } from '../lib/orderStatus'
import Invoice from '../components/Invoice'
import { Btn, inputClass, labelClass } from './ui'

/**
 * Orders admin. Reads via the authenticated session ("auth read orders" RLS).
 * Status / tracking / carrier / notes are editable through the order detail
 * panel, which saves via the api/update-order serverless function (it verifies
 * the admin token and writes with the service_role key). Each order also has a
 * printable invoice.
 */
export default function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null) // order in the detail panel
  const [invoiceOrder, setInvoiceOrder] = useState(null) // order in the invoice modal
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')

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

  // Merge an updated order back into local state (after a save).
  const applyUpdate = (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
    setSelected((s) => (s && s.id === updated.id ? { ...s, ...updated } : s))
  }

  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setBulkMsg('')
  }

  const toggleAll = (ids) => {
    setCheckedIds((prev) => {
      if (ids.every((id) => prev.has(id))) return new Set()
      return new Set(ids)
    })
    setBulkMsg('')
  }

  const applyBulk = async () => {
    if (!bulkStatus || checkedIds.size === 0) return
    setBulkBusy(true)
    setBulkMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Session expired.')

      const ids = [...checkedIds]
      await Promise.all(
        ids.map((id) =>
          fetch('/api/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, status: bulkStatus }),
          }),
        ),
      )
      setOrders((prev) =>
        prev.map((o) => (checkedIds.has(o.id) ? { ...o, status: bulkStatus } : o)),
      )
      setBulkMsg(`Updated ${ids.length} order${ids.length !== 1 ? 's' : ''} to "${bulkStatus}".`)
      setCheckedIds(new Set())
      setBulkStatus('')
    } catch (e) {
      setBulkMsg(e.message)
    } finally {
      setBulkBusy(false)
    }
  }

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

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const hay = [o.customer_name, o.customer_email, o.razorpay_order_id, o.razorpay_payment_id, o.invoice_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return (
    <>
      {/* Search + status filter + CSV export */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, reference…"
          className={`${inputClass} max-w-xs`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} max-w-[180px]`}>
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink/35">{filtered.length} of {orders.length}</span>
        <Btn variant="ghost" type="button" onClick={() => exportCsv(filtered)} className="ml-auto">
          Export CSV
        </Btn>
      </div>

      {/* Bulk action toolbar — visible when any rows are checked */}
      {checkedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink/5 px-4 py-3">
          <span className="font-mono text-[11px] text-ink/60">{checkedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className={`${inputClass} max-w-[180px]`}
          >
            <option value="">Set status…</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Btn variant="flame" onClick={applyBulk} disabled={bulkBusy || !bulkStatus}>
            {bulkBusy ? 'Updating…' : 'Apply'}
          </Btn>
          <button onClick={() => setCheckedIds(new Set())} className="font-mono text-[10px] text-ink/40 hover:text-ink">
            Clear
          </button>
          {bulkMsg ? <span className="font-mono text-[10px] text-green-700">{bulkMsg}</span> : null}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <Th>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((o) => checkedIds.has(o.id))}
                  onChange={() => toggleAll(filtered.map((o) => o.id))}
                  className="h-4 w-4 cursor-pointer accent-flame-500"
                  aria-label="Select all"
                />
              </Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const itemCount = itemTotalQty(o.items)
              return (
                <tr
                  key={o.id}
                  className={`border-b border-ink/5 last:border-0 hover:bg-silver-50 ${checkedIds.has(o.id) ? 'bg-flame-50/40' : ''}`}
                >
                  <Td>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(o.id)}
                      onChange={() => toggleCheck(o.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 cursor-pointer accent-flame-500"
                      aria-label="Select order"
                    />
                  </Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer">
                    <span className="font-mono text-[11px] text-ink/70">{formatDate(o.created_at)}</span>
                  </Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer">
                    <div className="font-mono text-[12px] text-ink">{o.customer_name || '—'}</div>
                    <div className="font-mono text-[10px] text-ink/40">{o.customer_email || ''}</div>
                  </Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer"><span className="font-mono text-[12px] text-ink/70">{itemCount}</span></Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer">
                    <span className="font-pixel text-sm text-flame-600">
                      {formatPrice(Math.round((o.amount || 0) / 100), o.currency || 'INR')}
                    </span>
                  </Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer"><StatusChip status={o.status} /></Td>
                  <Td onClick={() => setSelected(o)} className="cursor-pointer"><span className="font-mono text-[10px] uppercase tracking-wider text-ink/35">View →</span></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[11px] text-ink/40">No orders match that filter.</p>
        ) : null}
      </div>

      <OrderDetail
        order={selected}
        onClose={() => setSelected(null)}
        onSaved={applyUpdate}
        onShowInvoice={() => setInvoiceOrder(selected)}
      />
      {invoiceOrder ? <Invoice order={invoiceOrder} onClose={() => setInvoiceOrder(null)} /> : null}
    </>
  )
}

function OrderDetail({ order, onClose, onSaved, onShowInvoice }) {
  const [form, setForm] = useState({ status: '', tracking_number: '', carrier: '', admin_notes: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveErr, setSaveErr] = useState('')

  // Sync the form whenever a different order is opened.
  useEffect(() => {
    if (!order) return
    setForm({
      status: order.status || 'created',
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      admin_notes: order.admin_notes || '',
    })
    setSaveMsg('')
    setSaveErr('')
  }, [order?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    setSaveErr('')
    setSaveMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Your session expired — sign in again.')
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: order.id, ...form }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Save failed (HTTP ${res.status}).`)
      onSaved(data.order)
      setSaveMsg(data.emailSent ? 'Saved · customer emailed.' : 'Saved.')
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

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
                  {order.invoice_number || 'Order'} · {formatDate(order.created_at)}
                </div>
                <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-black uppercase tracking-tight">
                  {formatPrice(Math.round((order.amount || 0) / 100), order.currency || 'INR')}
                  <StatusChip status={form.status || order.status} />
                </h2>
              </div>
              <button onClick={onClose} className="text-2xl leading-none text-ink/50 hover:text-ink" aria-label="Close">×</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Fulfilment — editable */}
              <Section title="Fulfilment">
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select className={inputClass} value={form.status} onChange={set('status')}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Carrier</span>
                    <input className={inputClass} value={form.carrier} onChange={set('carrier')} placeholder="e.g. Delhivery" />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tracking #</span>
                    <input className={inputClass} value={form.tracking_number} onChange={set('tracking_number')} placeholder="AWB / tracking" />
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className={labelClass}>Internal notes</span>
                  <textarea className={`${inputClass} min-h-20 resize-y`} value={form.admin_notes} onChange={set('admin_notes')} placeholder="Private — not shown to the customer." />
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <Btn variant="flame" type="button" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Btn>
                  {saveMsg ? <span className="font-mono text-[10px] text-green-700">{saveMsg}</span> : null}
                  {saveErr ? <span className="font-mono text-[10px] text-flame-700">{saveErr}</span> : null}
                </div>
                <p className="mt-2 font-mono text-[9px] text-ink/35">Setting status to shipped/delivered emails the customer (if email is configured).</p>
              </Section>

              <Section title="Customer">
                <Line label="Name" value={order.customer_name} />
                <Line label="Email" value={order.customer_email} />
                <Line label="Phone" value={order.customer_phone} />
              </Section>

              <Section title="Ship to">{renderAddress(order.shipping_address)}</Section>

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

              <Section title="Payment & invoice">
                <Line label="Total" value={formatPrice(Math.round((order.amount || 0) / 100), order.currency || 'INR')} />
                <Line label="Invoice no." value={order.invoice_number} mono />
                <Line label="Razorpay order" value={order.razorpay_order_id} mono />
                <Line label="Razorpay payment" value={order.razorpay_payment_id} mono />
                <div className="mt-3">
                  <Btn variant="ghost" type="button" onClick={onShowInvoice}>View / print invoice</Btn>
                </div>
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

function exportCsv(orders) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = ['Invoice', 'Date', 'Name', 'Email', 'Phone', 'Items', 'Amount (INR)', 'Status', 'Carrier', 'Tracking', 'Coupon', 'Discount']
  const rows = orders.map((o) => {
    const addr = o.shipping_address ? (typeof o.shipping_address === 'string' ? safeParse(o.shipping_address) : o.shipping_address) : {}
    return [
      o.invoice_number || '',
      o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '',
      o.customer_name || '',
      o.customer_email || '',
      o.customer_phone || '',
      itemTotalQty(o.items),
      Math.round((o.amount || 0) / 100),
      o.status || '',
      o.carrier || '',
      o.tracking_number || '',
      o.coupon_code || '',
      Math.round((o.discount || 0) / 100),
    ]
  })
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mettel-orders-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${statusStyle(status)}`}>
      {status || 'created'}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40 ${className}`}>{children}</th>
}

function Td({ children, onClick, className = '' }) {
  return <td onClick={onClick} className={`px-4 py-3 align-top ${className}`}>{children}</td>
}
