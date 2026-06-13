import { useState } from 'react'
import { slugify } from '../lib/dataStore'
import { Field, Btn, inputClass } from './ui'

export default function CategoryManager({ categories, products, onSave, onDelete }) {
  const [label, setLabel] = useState('')
  const [editing, setEditing] = useState(null) // id being edited
  const [editLabel, setEditLabel] = useState('')
  const [error, setError] = useState('')

  const usageCount = (id) => products.filter((p) => p.category_id === id).length

  async function add() {
    const name = label.trim()
    if (!name) return
    const id = slugify(name)
    if (categories.some((c) => c.id === id)) return setError('That category already exists.')
    setError('')
    await onSave({ id, label: name, slug: id, active: true })
    setLabel('')
  }

  async function toggleActive(c) {
    await onSave({ ...c, active: !c.active })
  }

  async function saveEdit(c) {
    const name = editLabel.trim()
    if (!name) return
    await onSave({ ...c, label: name })
    setEditing(null)
  }

  async function remove(c) {
    const n = usageCount(c.id)
    if (n > 0) return setError(`“${c.label}” has ${n} product(s). Reassign or delete them first.`)
    setError('')
    if (confirm(`Delete category “${c.label}”?`)) await onDelete(c.id)
  }

  return (
    <div className="space-y-6">
      {/* Add row */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
        <div className="flex items-end gap-3">
          <Field label="New category" className="flex-1">
            <input
              className={inputClass}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Chargers"
            />
          </Field>
          <Btn variant="flame" onClick={add} className="mb-0.5">Add category</Btn>
        </div>
        {label.trim() ? (
          <p className="mt-2 font-mono text-[10px] text-ink/40">id / slug → {slugify(label)}</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
      ) : null}

      {/* List */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-ink/5">
        <table className="w-full bg-white text-left">
          <thead>
            <tr className="border-b border-ink/10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Products</th>
              <th className="px-4 py-3 font-normal">Visible</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  {editing === c.id ? (
                    <input
                      autoFocus
                      className={`${inputClass} max-w-xs`}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(c)}
                    />
                  ) : (
                    <div>
                      <div className="font-display text-sm font-black uppercase">{c.label}</div>
                      <div className="font-mono text-[10px] text-ink/40">{c.id}</div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-ink/60">{usageCount(c.id)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      c.active ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
                    }`}
                  >
                    {c.active ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editing === c.id ? (
                      <>
                        <Btn variant="flame" onClick={() => saveEdit(c)}>Save</Btn>
                        <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
                      </>
                    ) : (
                      <>
                        <Btn variant="ghost" onClick={() => { setEditing(c.id); setEditLabel(c.label) }}>Rename</Btn>
                        <Btn variant="danger" onClick={() => remove(c)}>Del</Btn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
