import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Btn, inputClass, labelClass } from './ui'

const BLANK = { code: '', type: 'percent', value: 10, min_subtotal: 0, usage_limit: '', active: true, expires_at: '' }

export default function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCoupons(data ?? [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load coupons.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (isSupabaseConfigured) load()
    else setLoading(false)
  }, [])

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function save() {
    setError('')
    const code = form.code.trim().toUpperCase()
    if (!code) return setError('Code is required.')
    setSaving(true)
    try {
      const payload = {
        code,
        type: form.type,
        value: Number(form.value) || 0,
        min_subtotal: Number(form.min_subtotal) || 0,
        usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
        active: !!form.active,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      }
      const { error } = await supabase.from('coupons').upsert(payload)
      if (error) throw error
      setForm(BLANK)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c) => {
    await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code)
    load()
  }
  const remove = async (c) => {
    if (confirm(`Delete coupon ${c.code}?`)) {
      await supabase.from('coupons').delete().eq('code', c.code)
      load()
    }
  }
  const edit = (c) =>
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_subtotal: c.min_subtotal || 0,
      usage_limit: c.usage_limit ?? '',
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    })

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-silver-50 p-8 text-center">
        <p className="font-mono text-[12px] text-ink/50">Connect Supabase and run <span className="text-flame-700">supabase/coupons.sql</span> to manage coupons.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Editor */}
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">{form.code ? 'Edit / add' : 'New coupon'}</div>
        <div className="space-y-3">
          <label className="block">
            <span className={labelClass}>Code</span>
            <input className={inputClass} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Type</span>
              <select className={inputClass} value={form.type} onChange={set('type')}>
                <option value="percent">Percent %</option>
                <option value="fixed">Fixed ₹</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>{form.type === 'percent' ? 'Percent' : 'Amount ₹'}</span>
              <input type="number" className={inputClass} value={form.value} onChange={set('value')} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Min ₹ subtotal</span>
              <input type="number" className={inputClass} value={form.min_subtotal} onChange={set('min_subtotal')} />
            </label>
            <label className="block">
              <span className={labelClass}>Usage limit</span>
              <input type="number" className={inputClass} value={form.usage_limit} onChange={set('usage_limit')} placeholder="∞" />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Expires</span>
            <input type="date" className={inputClass} value={form.expires_at} onChange={set('expires_at')} />
          </label>
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink/70">
            <input type="checkbox" checked={form.active} onChange={set('active')} className="h-4 w-4 accent-flame-500" /> Active
          </label>
          {error ? <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[10px] text-flame-700">{error}</p> : null}
          <div className="flex gap-2">
            <Btn variant="flame" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</Btn>
            {form.code ? <Btn variant="ghost" onClick={() => setForm(BLANK)}>Clear</Btn> : null}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        {loading ? (
          <div className="h-48 animate-pulse bg-silver-200" />
        ) : coupons.length === 0 ? (
          <p className="px-4 py-10 text-center font-mono text-[11px] text-ink/40">No coupons yet.</p>
        ) : (
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/40">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-ink">{c.code}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink/70">
                    {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                    {c.min_subtotal ? <span className="text-ink/35"> · min ₹{c.min_subtotal}</span> : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink/50">{c.used_count || 0}{c.usage_limit != null ? ` / ${c.usage_limit}` : ''}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(c)} className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${c.active ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'}`}>
                      {c.active ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Btn variant="ghost" onClick={() => edit(c)}>Edit</Btn>
                      <Btn variant="danger" onClick={() => remove(c)}>Del</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
