import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Btn } from './ui'

/**
 * Admin reviews moderation panel. Shows all reviews (pending + approved).
 * Admins can approve, reject (soft-flag as approved=false), or delete.
 */
export default function ReviewsManager() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending | approved | all

  const load = async () => {
    setLoading(true)
    let q = supabase.from('reviews').select('*').order('created_at', { ascending: false })
    const { data } = await q
    setReviews(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (isSupabaseConfigured) load() }, [])

  const approve = async (id) => {
    await supabase.from('reviews').update({ approved: true }).eq('id', id)
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)))
  }

  const reject = async (id) => {
    await supabase.from('reviews').update({ approved: false }).eq('id', id)
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: false } : r)))
  }

  const remove = async (id) => {
    if (!confirm('Delete this review permanently?')) return
    await supabase.from('reviews').delete().eq('id', id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  if (!isSupabaseConfigured) {
    return <p className="font-mono text-[11px] text-ink/50">Reviews need Supabase to be configured.</p>
  }

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.approved
    if (filter === 'approved') return r.approved
    return true
  })

  const pendingCount = reviews.filter((r) => !r.approved).length

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          ['pending', `Pending (${pendingCount})`],
          ['approved', 'Approved'],
          ['all', 'All'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              filter === key ? 'bg-black text-[#fff]' : 'bg-silver-200 text-ink hover:bg-ink/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-silver-200" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 p-8 text-center">
          <p className="font-mono text-[11px] text-ink/40">
            {filter === 'pending' ? 'No pending reviews.' : 'No reviews found.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-mono text-[12px] font-bold text-ink">{r.name}</span>
                    <span className="font-mono text-[10px] text-ink/40">{r.email}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink/35">
                    Product: <span className="text-ink/60">{r.product_id}</span> · {formatDate(r.created_at)}
                  </div>
                  {r.body ? <p className="mt-2 font-mono text-[12px] text-ink/70">{r.body}</p> : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${r.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.approved ? 'Approved' : 'Pending'}
                  </span>
                  {!r.approved ? (
                    <Btn variant="flame" onClick={() => approve(r.id)}>Approve</Btn>
                  ) : (
                    <Btn variant="ghost" onClick={() => reject(r.id)}>Unpublish</Btn>
                  )}
                  <Btn variant="danger" onClick={() => remove(r.id)}>Delete</Btn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stars({ value }) {
  return (
    <span className="inline-flex" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm leading-none ${s <= value ? 'text-flame-500' : 'text-ink/20'}`}>★</span>
      ))}
    </span>
  )
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}
