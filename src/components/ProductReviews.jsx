import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase
      .from('reviews')
      .select('id,name,rating,body,created_at,approved')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data ?? [])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  const approved = reviews.filter((r) => r.approved)
  const avg = approved.length
    ? (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1)
    : null

  if (!isSupabaseConfigured) return null

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-3xl font-black uppercase tracking-tight">Reviews</h2>
        {avg ? (
          <div className="flex items-center gap-2">
            <Stars value={parseFloat(avg)} />
            <span className="font-mono text-[11px] text-ink/50">{avg} · {approved.length} review{approved.length !== 1 ? 's' : ''}</span>
          </div>
        ) : null}
      </div>

      <ReviewForm productId={productId} onPosted={() => { setLoading(true); load() }} />

      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-silver-200" />
      ) : approved.length === 0 ? (
        <p className="mt-6 font-mono text-[11px] text-ink/40">No reviews yet. Be the first.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {approved.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Stars value={r.rating} />
                  <span className="ml-2 font-mono text-[11px] font-bold text-ink">{r.name}</span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink/35">{formatDate(r.created_at)}</span>
              </div>
              {r.body ? <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink/70">{r.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ReviewForm({ productId, onPosted }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return setErr('Please pick a star rating.')
    if (!name.trim()) return setErr('Please enter your name.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      email: user.email,
      name: name.trim(),
      rating,
      body: body.trim() || null,
      approved: false,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    setDone(true)
    onPosted()
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-silver-100 px-5 py-4 ring-1 ring-ink/10">
        <p className="font-mono text-[11px] text-ink/60">
          <a href="/account" className="underline hover:text-flame-600">Sign in</a> to leave a review.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-green-50 px-5 py-4 ring-1 ring-green-200">
        <p className="font-mono text-[11px] text-green-700">Thanks for your review — it'll appear once approved.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">Write a review</div>

      {/* Star picker */}
      <div className="mb-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHover(s)}
            onClick={() => setRating(s)}
            className={`text-2xl transition-colors ${s <= (hover || rating) ? 'text-flame-500' : 'text-ink/20'}`}
            aria-label={`${s} star`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="mb-2 w-full rounded-xl border border-ink/15 bg-silver-50 px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-ink/30 focus:border-flame-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think? (optional)"
        rows={3}
        className="mb-3 w-full resize-none rounded-xl border border-ink/15 bg-silver-50 px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-ink/30 focus:border-flame-500"
      />

      {err ? <p className="mb-2 font-mono text-[10px] text-flame-700">{err}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-black px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-flame-500 disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}

function Stars({ value }) {
  return (
    <span className="inline-flex" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-base leading-none ${s <= Math.round(value) ? 'text-flame-500' : 'text-ink/20'}`}>
          ★
        </span>
      ))}
    </span>
  )
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}
