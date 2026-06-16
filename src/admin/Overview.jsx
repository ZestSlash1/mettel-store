import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPrice } from '../hooks/useProducts'

// Statuses that count as real revenue.
const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered']
const PENDING_STATUSES = ['paid', 'processing']

export default function Overview() {
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
        const { data, error } = await supabase
          .from('orders')
          .select('status, amount, currency, items, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (active) {
          setOrders(data ?? [])
          setError('')
        }
      } catch (e) {
        if (active) setError(e.message || 'Could not load metrics.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const m = useMemo(() => computeMetrics(orders), [orders])

  if (!isSupabaseConfigured) {
    return <Empty msg="Connect Supabase to see metrics." />
  }
  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-silver-200" />
  if (error) {
    return (
      <div className="rounded-2xl border border-flame-700/20 bg-flame-100 p-6 text-center">
        <p className="font-mono text-[12px] text-flame-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={formatPrice(m.revenue, m.currency)} hint={`${m.paidCount} paid orders`} />
        <Stat label="Avg order" value={formatPrice(m.aov, m.currency)} hint="Per paid order" />
        <Stat label="To fulfil" value={m.pendingCount} hint="Paid · processing" accent />
        <Stat label="Last 30 days" value={formatPrice(m.revenue30, m.currency)} hint={`${m.count30} orders`} />
      </div>

      {/* 14-day revenue bars */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6">
        <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Revenue · last 14 days</div>
        {m.daily.some((d) => d.total > 0) ? (
          <div className="flex h-40 items-end gap-1.5">
            {m.daily.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${formatPrice(d.total, m.currency)}`}>
                <div
                  className="w-full rounded-t bg-flame-500/80 transition-colors group-hover:bg-flame-600"
                  style={{ height: `${m.maxDaily ? Math.max(2, (d.total / m.maxDaily) * 100) : 0}%` }}
                />
                <span className="mt-1 font-mono text-[8px] text-ink/30">{d.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center font-mono text-[11px] text-ink/40">No revenue in the last 14 days.</p>
        )}
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6">
        <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Top products (by units sold)</div>
        {m.topProducts.length ? (
          <ul className="space-y-2">
            {m.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2 last:border-0">
                <span className="flex items-center gap-3 font-mono text-[12px] text-ink">
                  <span className="font-pixel text-flame-600">{i + 1}</span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="font-mono text-[11px] text-ink/50">{p.qty} sold</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center font-mono text-[11px] text-ink/40">No sales yet.</p>
        )}
      </div>
    </div>
  )
}

function computeMetrics(orders) {
  const paid = orders.filter((o) => REVENUE_STATUSES.includes(o.status))
  const revenue = paid.reduce((s, o) => s + Math.round((o.amount || 0) / 100), 0)
  const paidCount = paid.length
  const aov = paidCount ? Math.round(revenue / paidCount) : 0
  const pendingCount = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length
  const currency = orders[0]?.currency || 'INR'

  const now = Date.now()
  const dayMs = 86400000
  const within30 = paid.filter((o) => now - new Date(o.created_at).getTime() <= 30 * dayMs)
  const revenue30 = within30.reduce((s, o) => s + Math.round((o.amount || 0) / 100), 0)
  const count30 = within30.length

  // 14-day daily revenue buckets (oldest → newest).
  const daily = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * dayMs)
    const key = d.toISOString().slice(0, 10)
    const total = paid
      .filter((o) => (o.created_at || '').slice(0, 10) === key)
      .reduce((s, o) => s + Math.round((o.amount || 0) / 100), 0)
    daily.push({ day: key, label: d.getDate(), total })
  }
  const maxDaily = Math.max(0, ...daily.map((d) => d.total))

  // Top products by units across paid orders.
  const counts = new Map()
  for (const o of paid) {
    for (const it of Array.isArray(o.items) ? o.items : []) {
      const name = it.name || it.id || '—'
      counts.set(name, (counts.get(name) || 0) + (Number(it.qty) || 0))
    }
  }
  const topProducts = [...counts.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  return { revenue, paidCount, aov, pendingCount, currency, revenue30, count30, daily, maxDaily, topProducts }
}

function Stat({ label, value, hint, accent }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-flame-500/30 bg-flame-50' : 'border-ink/10 bg-white'}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">{label}</div>
      <div className="mt-1 font-display text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 font-mono text-[10px] text-ink/40">{hint}</div>
    </div>
  )
}

function Empty({ msg }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-silver-50 p-8 text-center">
      <p className="font-mono text-[12px] text-ink/50">{msg}</p>
    </div>
  )
}
