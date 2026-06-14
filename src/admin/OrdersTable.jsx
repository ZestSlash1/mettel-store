import { useEffect, useState } from 'react'
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
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-ink/10 text-left">
            <Th>Date</Th>
            <Th>Customer</Th>
            <Th>Items</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const itemCount = Array.isArray(o.items)
              ? o.items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
              : 0
            return (
              <tr key={o.id} className="border-b border-ink/5 last:border-0 hover:bg-silver-50">
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
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
