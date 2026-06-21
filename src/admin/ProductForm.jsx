import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { makeProductId, slugify, listPhoneModels } from '../lib/dataStore'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPrice } from '../hooks/useProducts'
import ProductGraphic from '../components/ProductGraphic'
import { Field, Btn, inputClass, labelClass } from './ui'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/webp', 'image/jpeg']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // ~2 MB
const EXT_BY_TYPE = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' }

const STATUS = ['available', 'preorder', 'soldout']
const CURRENCIES = ['INR', 'USD']
const COLORWAY_MATERIALS = ['aramid', 'aluminium', 'leather', 'frosted', 'tpu']

const BLANK = {
  id: '',
  sku: '',
  category_id: '',
  name: '',
  tagline: '',
  price: 0,
  currency: 'INR',
  status: 'available',
  is_featured: false,
  color: '',
  color_hex: '#cfcfcf',
  accent_hex: '#ff6b00',
  specs: [{ k: '', v: '' }],
  image: null,
  images: [],
  models: [],
  colorways: [],
  related_ids: [],
  stock: 0,
  rank: 0,
  video_url: '',
}

export default function ProductForm({ product, categories, products = [], existingIds, onSave, onCancel }) {
  const isNew = !product
  const [form, setForm] = useState(() => {
    // Initialise images: if an existing product has none, seed from image.
    const existingImages = product?.images?.length
      ? product.images
      : product?.image
        ? [product.image]
        : []
    return {
      ...BLANK,
      ...product,
      images: existingImages,
      specs: product?.specs?.length ? product.specs : [{ k: '', v: '' }],
      colorways: product?.colorways?.length ? product.colorways : [],
      related_ids: product?.related_ids?.length ? product.related_ids : [],
      category_id: product?.category_id || categories[0]?.id || '',
    }
  })
  const [modelsText, setModelsText] = useState((product?.models || []).join(', '))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [phoneModels, setPhoneModels] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    listPhoneModels().then(setPhoneModels)
  }, [])

  function addModelLabel(label) {
    const current = modelsText.split(',').map((m) => m.trim()).filter(Boolean)
    if (current.includes(label)) return
    setModelsText([...current, label].join(', '))
  }

  function setColorway(i, patch) {
    setForm((f) => {
      const colorways = f.colorways.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
      return { ...f, colorways }
    })
  }
  function addColorway() {
    setForm((f) => ({
      ...f,
      colorways: [
        ...f.colorways,
        { id: `cw-${Date.now()}`, name: '', material: 'aramid', color_hex: f.color_hex, accent_hex: f.accent_hex, swatch: '', image: '' },
      ],
    }))
  }
  function removeColorway(i) {
    setForm((f) => ({ ...f, colorways: f.colorways.filter((_, idx) => idx !== i) }))
  }

  function addRelated(id) {
    setForm((f) => (f.related_ids.includes(id) ? f : { ...f, related_ids: [...f.related_ids, id] }))
  }
  function removeRelated(id) {
    setForm((f) => ({ ...f, related_ids: f.related_ids.filter((rid) => rid !== id) }))
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  async function uploadImageFile(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Use a PNG, WEBP or JPEG image.')
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be under 2 MB.')
    if (!isSupabaseConfigured) throw new Error('Connect Supabase to upload images.')

    const ext = EXT_BY_TYPE[file.type] || 'png'
    const base = slugify(form.sku || form.name) || 'product'
    const path = `${base}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw upErr

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      setForm((f) => {
        const images = [...(f.images || []), url]
        return { ...f, images, image: images[0] }
      })
    } catch (err) {
      setUploadError(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(idx) {
    setForm((f) => {
      const images = f.images.filter((_, i) => i !== idx)
      return { ...f, images, image: images[0] || null }
    })
  }

  function moveImage(from, to) {
    setForm((f) => {
      const images = [...f.images]
      const [item] = images.splice(from, 1)
      images.splice(to, 0, item)
      return { ...f, images, image: images[0] || null }
    })
  }

  const setSpec = (i, key, value) =>
    setForm((f) => {
      const specs = f.specs.map((s, idx) => (idx === i ? { ...s, [key]: value } : s))
      return { ...f, specs }
    })
  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { k: '', v: '' }] }))
  const removeSpec = (i) => setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }))

  const previewProduct = useMemo(
    () => ({ ...form, price: Number(form.price) || 0 }),
    [form],
  )

  async function handleSave() {
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.sku.trim()) return setError('SKU is required.')
    if (!form.category_id) return setError('Pick a category.')

    setSaving(true)
    setError('')
    try {
      const cleanSpecs = form.specs.filter((s) => s.k.trim() || s.v.trim())
      const models = modelsText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
      const cleanColorways = (form.colorways || [])
        .filter((c) => c.name?.trim())
        .map((c) => ({ ...c, name: c.name.trim() }))

      const cleanImages = (form.images || []).filter((u) => u?.trim())
      const payload = {
        ...form,
        id: form.id || makeProductId(form.sku || form.name, existingIds),
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        rank: Number(form.rank) || 0,
        image: cleanImages[0] || null,
        images: cleanImages,
        specs: cleanSpecs,
        models,
        colorways: cleanColorways,
        related_ids: (form.related_ids || []).filter((id) => id !== (form.id || '')),
      }
      await onSave(payload)
    } catch (e) {
      setError(e?.message || 'Could not save.')
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full w-full max-w-2xl flex-col bg-silver-50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
            {isNew ? 'New product' : `Editing · ${product.id}`}
          </div>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">
            {form.name || 'Untitled'}
          </h2>
        </div>
        <button onClick={onCancel} className="text-2xl leading-none text-ink/50 hover:text-ink" aria-label="Close">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Live preview strip */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
          <div className="w-16 shrink-0">
            {(form.images?.[0] || form.image) ? (
              <div className="aspect-[1/2] w-full">
                <img src={form.images?.[0] || form.image} alt="" className="h-full w-full object-contain" />
              </div>
            ) : (
              <ProductGraphic className="h-auto w-full" shell={form.color_hex} accent={form.accent_hex} />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-black uppercase">{form.name || '—'}</div>
            <div className="truncate font-mono text-[11px] text-ink/55">{form.tagline || 'No tagline'}</div>
            <div className="font-pixel text-sm text-flame-600">
              {formatPrice(previewProduct.price, form.currency)}
            </div>
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *" className="col-span-2">
            <input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Aramid Shell 01 · Studio Tumbler 500" />
          </Field>

          <Field label="SKU *">
            <input className={inputClass} value={form.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} placeholder="MT-0001" />
          </Field>

          <Field label="Category *">
            <select className={inputClass} value={form.category_id} onChange={(e) => set({ category_id: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Tagline" className="col-span-2">
            <input className={inputClass} value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="A short, punchy product line." />
          </Field>

          <Field label="Video URL (YouTube)" className="col-span-2">
            <input className={inputClass} value={form.video_url || ''} onChange={(e) => set({ video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
          </Field>

          <Field label="Price">
            <input type="number" className={inputClass} value={form.price} onChange={(e) => set({ price: e.target.value })} />
          </Field>
          <Field label="Currency">
            <select className={inputClass} value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Stock">
            <input type="number" className={inputClass} value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
          </Field>

          <Field label="Color name">
            <input className={inputClass} value={form.color} onChange={(e) => set({ color: e.target.value })} placeholder="Carbon" />
          </Field>
          <Field label="Display rank" hint="Lower shows first">
            <input type="number" className={inputClass} value={form.rank} onChange={(e) => set({ rank: e.target.value })} />
          </Field>

          <Field label="Primary color">
            <div className="flex items-center gap-2">
              <input type="color" value={form.color_hex} onChange={(e) => set({ color_hex: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-ink/15" />
              <input className={inputClass} value={form.color_hex} onChange={(e) => set({ color_hex: e.target.value })} />
            </div>
          </Field>
          <Field label="Accent color">
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_hex} onChange={(e) => set({ accent_hex: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-ink/15" />
              <input className={inputClass} value={form.accent_hex} onChange={(e) => set({ accent_hex: e.target.value })} />
            </div>
          </Field>

          <div className="col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className={labelClass}>Images <span className="normal-case text-ink/35">(first = primary · PNG/WEBP/JPEG · max 2 MB each)</span></span>
              <span className="font-mono text-[10px] text-ink/35">{form.images?.length || 0} image{form.images?.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Gallery grid */}
            {form.images?.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl bg-silver-100 ring-2 ring-ink/10">
                    <img src={url} alt="" className="h-full w-full object-contain" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-flame-500 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-[#fff]">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5">
                      {i > 0 ? (
                        <button onClick={() => moveImage(i, i - 1)} className="font-mono text-[10px] text-[#fff]/80 hover:text-[#fff]" title="Move left">←</button>
                      ) : <span />}
                      <button onClick={() => removeImage(i)} className="font-mono text-[10px] text-[#fff]/80 hover:text-flame-400" title="Remove">×</button>
                      {i < form.images.length - 1 ? (
                        <button onClick={() => moveImage(i, i + 1)} className="font-mono text-[10px] text-[#fff]/80 hover:text-[#fff]" title="Move right">→</button>
                      ) : <span />}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                onChange={handleImageFile}
                className="hidden"
              />
              <Btn variant="ghost" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '+ Add image'}
              </Btn>
            </div>
            {uploadError ? (
              <p className="mt-2 rounded-xl bg-flame-50 px-3 py-2 font-mono text-[10px] text-flame-700">{uploadError}</p>
            ) : null}
          </div>

          <Field label="Variants / models" hint="Comma-separated — devices, sizes, or options. Shown as the buyer’s selector." className="col-span-2">
            <input className={inputClass} value={modelsText} onChange={(e) => setModelsText(e.target.value)} placeholder="iPhone 16 Pro, Pixel 9 Pro  ·  or  ·  500 ml, 1 L" />
            {phoneModels.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {phoneModels.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => addModelLabel(m.label)}
                    className="rounded-full bg-silver-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60 hover:bg-ink/10"
                  >
                    + {m.label}
                  </button>
                ))}
              </div>
            ) : null}
          </Field>

          <label className="col-span-2 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink/5">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set({ is_featured: e.target.checked })} className="h-4 w-4 accent-flame-500" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink/70">Featured product</span>
          </label>
        </div>

        {/* Specs editor */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className={labelClass}>Spec sheet</span>
            <Btn variant="ghost" onClick={addSpec} type="button">+ Add row</Btn>
          </div>
          <div className="space-y-2">
            {form.specs.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputClass} flex-1`} placeholder="KEY (e.g. MATERIAL)" value={s.k} onChange={(e) => setSpec(i, 'k', e.target.value.toUpperCase())} />
                <input className={`${inputClass} flex-1`} placeholder="VALUE (e.g. STAINLESS STEEL)" value={s.v} onChange={(e) => setSpec(i, 'v', e.target.value)} />
                <button onClick={() => removeSpec(i)} className="shrink-0 rounded-lg px-2 py-2 text-ink/40 hover:text-flame-700" aria-label="Remove spec">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Colorways editor */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className={labelClass}>
              Colorways <span className="normal-case text-ink/35">(drives the live 3D material swap + mobile image swap)</span>
            </span>
            <Btn variant="ghost" onClick={addColorway} type="button">+ Add colorway</Btn>
          </div>
          {form.colorways?.length ? (
            <div className="space-y-3">
              {form.colorways.map((cw, i) => (
                <div key={cw.id || i} className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input
                      className={`${inputClass} col-span-2 sm:col-span-1`}
                      placeholder="Name (e.g. Carbon)"
                      value={cw.name}
                      onChange={(e) => setColorway(i, { name: e.target.value })}
                    />
                    <select
                      className={inputClass}
                      value={cw.material}
                      onChange={(e) => setColorway(i, { material: e.target.value })}
                    >
                      {COLORWAY_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={cw.color_hex || '#cfcfcf'} onChange={(e) => setColorway(i, { color_hex: e.target.value })} className="h-9 w-9 cursor-pointer rounded-lg border border-ink/15" />
                      <input className={`${inputClass} flex-1`} placeholder="Color hex" value={cw.color_hex || ''} onChange={(e) => setColorway(i, { color_hex: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={cw.accent_hex || '#ff6b00'} onChange={(e) => setColorway(i, { accent_hex: e.target.value })} className="h-9 w-9 cursor-pointer rounded-lg border border-ink/15" />
                      <input className={`${inputClass} flex-1`} placeholder="Accent hex" value={cw.accent_hex || ''} onChange={(e) => setColorway(i, { accent_hex: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="Swatch image URL (optional — falls back to color)"
                      value={cw.swatch || ''}
                      onChange={(e) => setColorway(i, { swatch: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Product image URL for this colorway (mobile fallback)"
                      value={cw.image || ''}
                      onChange={(e) => setColorway(i, { image: e.target.value })}
                    />
                  </div>
                  <button onClick={() => removeColorway(i)} type="button" className="mt-2 font-mono text-[10px] uppercase tracking-wide text-ink/40 hover:text-flame-700">
                    Remove colorway
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-ink/40">No colorways — the product shows its single color/accent above.</p>
          )}
        </div>

        {/* Cross-sell editor */}
        <div className="mt-6">
          <span className={labelClass}>
            Complete the kit <span className="normal-case text-ink/35">(curated cross-sell — falls back to same-category suggestions when empty)</span>
          </span>
          {form.related_ids?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.related_ids.map((id) => {
                const p = products.find((pp) => pp.id === id)
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/70 ring-1 ring-ink/10">
                    {p?.name || id}
                    <button onClick={() => removeRelated(id)} type="button" className="text-ink/40 hover:text-flame-700" aria-label={`Remove ${p?.name || id}`}>×</button>
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="mt-2 font-mono text-[11px] text-ink/40">No products added yet.</p>
          )}
          {products.filter((p) => p.id !== form.id && !form.related_ids.includes(p.id)).length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {products
                .filter((p) => p.id !== form.id && !form.related_ids.includes(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addRelated(p.id)}
                    className="rounded-full bg-silver-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60 hover:bg-ink/10"
                  >
                    + {p.name}
                  </button>
                ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-flame-50 px-3 py-2 font-mono text-[11px] text-flame-700">{error}</p>
        ) : null}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-ink/10 px-6 py-4">
        <Btn variant="ghost" onClick={onCancel} type="button">Cancel</Btn>
        <Btn variant="flame" onClick={handleSave} disabled={saving} type="button">
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </Btn>
      </div>
    </motion.div>
  )
}
