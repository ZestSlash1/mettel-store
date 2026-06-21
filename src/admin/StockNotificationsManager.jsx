import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export default function StockNotificationsManager() {
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending | notified | all

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const [{ data: notifs }, { data: prods }] = await Promise.all([
        supabase.from('stock_notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, sku'),
      ])
      setRows(notifs || [])
      setProducts(prods || [])
      setLoading(false)
    })()
  }, [])

  const markNotified = async (id) => {
    await supabase.from('stock_notifications').update({ notified: true }).eq('id', id)
    setRows((r) => r.map((n) => (n.id === id ? { ...n, notified: true } : n)))
  }

  const remove = async (id) => {
    if (!confirm('Delete this notification request?')) return
    await supabase.from('stock_notifications').delete().eq('id', id)
    setRows((r) => r.filter((n) => n.id !== id))
  }

  const productName = (id) => {
    const p = products.find((p) => p.id === id)
    return p ? `${p.name} (${p.sku})` : id
  }

  const exportCsv = () => {
    const lines = [
      ['Product', 'Email', 'Notified', 'Requested'].join(','),
      ...rows.map((n) =>
        [
          productName(n.product_id),
          n.email,
          n.notified ? 'yes' : 'no',
          new Date(n.created_at).toLocaleDateString('en-IN'),
        ].join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-notifications-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visible =
    filter === 'all'
      ? rows
      : filter === 'pending'
        ? rows.filter((n) => !n.notified)
        : rows.filter((n) => n.notified)

  const pendingCount = rows.filter((n) => !n.notified).length

  // Group pending by product to show demand at a glance
  const byProduct = rows
    .filter((n) => !n.notified)
    .reduce((acc, n) => {
      acc[n.product_id] = (acc[n.product_id] || 0) + 1
      return acc
    }, {})

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase">Back-in-stock requests</h2>
          <p className="mt-0.5 font-mono text-[11px] text-ink/40">
            {pendingCount} pending · {rows.length} total
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-full bg-black px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-flame-500"
        >
          Export CSV
        </button>
      </div>

      {/* Demand summary */}
      {Object.keys(byProduct).length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(byProduct)
            .sort(([, a], [, b]) => b - a)
            .map(([pid, count]) => (
              <div key={pid} className="rounded-xl bg-white px-4 py-3 ring-1 ring-ink/5">
                <div className="font-display text-2xl font-black">{count}</div>
                <div className="mt-0.5 font-mono text-[10px] text-ink/50 uppercase tracking-wider">waiting</div>
                <div className="mt-1 truncate font-mono text-[10px] text-ink/70">{productName(pid)}</div>
              </div>
            ))}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {[['pending', `Pending (${pendingCount})`], ['notified', 'Notified'], ['all', 'All']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              filter === k ? 'bg-black text-[#fff]' : 'bg-silver-200 text-ink hover:bg-ink/10'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-silver-200" />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-ink/30">
          {filter === 'pending' ? 'No pending requests' : 'No entries'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/8">
                <Th>Product</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Requested</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {visible.map((n) => (
                <tr key={n.id} className="border-b border-ink/5 last:border-0 hover:bg-silver-50">
                  <Td>{productName(n.product_id)}</Td>
                  <Td>{n.email}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      n.notified ? 'bg-green-100 text-green-700' : 'bg-flame-100 text-flame-700'
                    }`}>
                      {n.notified ? 'Notified' : 'Pending'}
                    </span>
                  </Td>
                  <Td>{new Date(n.created_at).toLocaleDateString('en-IN')}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {!n.notified && (
                        <button
                          onClick={() => markNotified(n.id)}
                          className="font-mono text-[10px] uppercase tracking-wider text-ink/40 hover:text-ink"
                        >
                          Mark notified
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="font-mono text-[10px] uppercase tracking-wider text-flame-500 hover:text-flame-700"
                      >
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }) {
  return <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">{children}</th>
}
function Td({ children }) {
  return <td className="px-4 py-3 font-mono text-[11px]">{children}</td>
}
