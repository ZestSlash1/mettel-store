import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export default function SubscribersManager() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | active | inactive

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })
      setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const toggle = async (id, active) => {
    await supabase.from('subscribers').update({ active }).eq('id', id)
    setRows((r) => r.map((s) => (s.id === id ? { ...s, active } : s)))
  }

  const remove = async (id) => {
    if (!confirm('Remove this subscriber?')) return
    await supabase.from('subscribers').delete().eq('id', id)
    setRows((r) => r.filter((s) => s.id !== id))
  }

  const exportCsv = () => {
    const lines = [
      ['Email', 'Active', 'Source', 'Subscribed'].join(','),
      ...rows.map((s) =>
        [s.email, s.active ? 'yes' : 'no', s.source || '', new Date(s.created_at).toLocaleDateString('en-IN')].join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visible = filter === 'all' ? rows : rows.filter((s) => (filter === 'active' ? s.active : !s.active))
  const activeCount = rows.filter((s) => s.active).length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase">Newsletter subscribers</h2>
          <p className="mt-0.5 font-mono text-[11px] text-ink/40">
            {activeCount} active · {rows.length} total
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-500"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {[['all', 'All'], ['active', 'Active'], ['inactive', 'Unsubscribed']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              filter === k ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-silver-200" />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-ink/30">No subscribers yet</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/8">
                <Th>Email</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-b border-ink/5 last:border-0 hover:bg-silver-50">
                  <Td>{s.email}</Td>
                  <Td>{s.source || '—'}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      s.active ? 'bg-green-100 text-green-700' : 'bg-silver-200 text-ink/40'
                    }`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td>{new Date(s.created_at).toLocaleDateString('en-IN')}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggle(s.id, !s.active)}
                        className="font-mono text-[10px] uppercase tracking-wider text-ink/40 hover:text-ink"
                      >
                        {s.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => remove(s.id)}
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
