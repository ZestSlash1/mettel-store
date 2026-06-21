import seed from '../data/products.json'
import { supabase, isSupabaseConfigured } from './supabaseClient'

/**
 * Single data layer for the whole app.
 *
 * Two modes, identical API:
 *  - Supabase configured  -> reads/writes go to the database.
 *  - Not configured       -> reads/writes use localStorage, seeded from
 *                            products.json on first run. Export the result
 *                            back into the repo to make it permanent.
 *
 * Components never branch on the mode — they call these functions and
 * subscribe() to re-render when anything changes.
 */

const LS_KEY = 'mettel:data:v1'
const listeners = new Set()

export const dataSource = isSupabaseConfigured ? 'supabase' : 'local'

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit() {
  listCache.clear()
  listeners.forEach((fn) => fn())
}

/* ---------------- local persistence ---------------- */

let cache = null

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return { products: clone(seed.products), categories: clone(seed.categories) }
}

function local() {
  if (!cache) cache = loadLocal()
  return cache
}

function saveLocal(next) {
  cache = next
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* storage full / unavailable — keep in-memory */
  }
  emit()
}

const clone = (v) => JSON.parse(JSON.stringify(v))

// Keep tabs in sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) {
      cache = e.newValue ? JSON.parse(e.newValue) : loadLocal()
      emit()
    }
  })
}

/* ---------------- reads (resilient) ---------------- */

// Short-lived cache of full product-list reads, keyed by category. Lets a
// card hover warm the exact query the PDP is about to make (useProducts()
// with no category filter), so the click feels instant. Invalidated on any
// write via emit().
const listCache = new Map()
const LIST_CACHE_TTL = 30_000

export async function listProducts({ category } = {}) {
  const cacheKey = category ?? '__all__'
  const cached = listCache.get(cacheKey)
  if (cached && Date.now() - cached.at < LIST_CACHE_TTL) return cached.data

  if (isSupabaseConfigured) {
    try {
      let q = supabase.from('products').select('*').order('rank', { ascending: true })
      if (category) q = q.eq('category_id', category)
      const { data, error } = await q
      if (error) throw error
      const items = data ?? []
      listCache.set(cacheKey, { data: items, at: Date.now() })
      return items
    } catch (e) {
      console.warn('[dataStore] product read failed, using seed:', e?.message)
    }
  }
  let items = clone(local().products).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  if (category) items = items.filter((p) => p.category_id === category)
  return items
}

/** Fire-and-forget warm-up of the no-filter product list — used on card hover/focus. */
export function prefetchProduct() {
  listProducts({}).catch(() => {})
}

export async function listCategories() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('categories').select('*')
      if (error) throw error
      return data ?? []
    } catch (e) {
      console.warn('[dataStore] category read failed, using seed:', e?.message)
    }
  }
  return clone(local().categories)
}

export async function getProduct(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) throw error
      if (data) return data
    } catch (e) {
      console.warn('[dataStore] single read failed, using seed:', e?.message)
    }
  }
  return clone(local().products).find((p) => p.id === id) || null
}

// Mirrors the seed rows in supabase/phone-models.sql — used only when
// Supabase isn't configured, so local/dev mode still has device proportions.
const LOCAL_PHONE_MODELS = [
  { label: 'iPhone 16 Pro Max', brand: 'Apple', aspect: 2.16, corner: 0.34, camera_layout: 'triple', rank: 1 },
  { label: 'iPhone 16 Pro', brand: 'Apple', aspect: 2.16, corner: 0.34, camera_layout: 'triple', rank: 2 },
  { label: 'iPhone 16', brand: 'Apple', aspect: 2.16, corner: 0.36, camera_layout: 'dual', rank: 3 },
  { label: 'Pixel 9 Pro', brand: 'Google', aspect: 2.1, corner: 0.3, camera_layout: 'triple', rank: 4 },
  { label: 'Pixel 9', brand: 'Google', aspect: 2.1, corner: 0.3, camera_layout: 'dual', rank: 5 },
  { label: 'Galaxy S25', brand: 'Samsung', aspect: 2.18, corner: 0.26, camera_layout: 'triple', rank: 6 },
]

/** Canonical device list (enriches products.models with 3D proportions). */
export async function listPhoneModels() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('phone_models').select('*').eq('active', true).order('rank', { ascending: true })
      if (error) throw error
      return data ?? []
    } catch (e) {
      console.warn('[dataStore] phone_models read failed, using local list:', e?.message)
    }
  }
  return clone(LOCAL_PHONE_MODELS)
}

/* ---------------- writes ---------------- */

export async function upsertProduct(product) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('products').upsert(product).select().single()
    if (error) throw error
    emit()
    return data
  }
  const next = clone(local())
  const i = next.products.findIndex((p) => p.id === product.id)
  if (i >= 0) next.products[i] = product
  else next.products.push(product)
  saveLocal(next)
  return product
}

export async function deleteProduct(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    emit()
    return
  }
  const next = clone(local())
  next.products = next.products.filter((p) => p.id !== id)
  saveLocal(next)
}

export async function upsertCategory(category) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('categories').upsert(category).select().single()
    if (error) throw error
    emit()
    return data
  }
  const next = clone(local())
  const i = next.categories.findIndex((c) => c.id === category.id)
  if (i >= 0) next.categories[i] = category
  else next.categories.push(category)
  saveLocal(next)
  return category
}

export async function deleteCategory(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    emit()
    return
  }
  const next = clone(local())
  next.categories = next.categories.filter((c) => c.id !== id)
  saveLocal(next)
}

/* ---------------- local-mode utilities ---------------- */

/** Current dataset as a plain object — used for Export. */
export function exportData() {
  return clone(local())
}

/** Overwrite local data (Import). */
export function importData(obj) {
  if (!obj || !Array.isArray(obj.products) || !Array.isArray(obj.categories)) {
    throw new Error('File must contain { products: [], categories: [] }')
  }
  saveLocal(clone(obj))
}

/** Restore the original seed. */
export function resetToSeed() {
  saveLocal({ products: clone(seed.products), categories: clone(seed.categories) })
}

/* ---------------- storefront settings ---------------- */

export async function getSetting(key) {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', key).single()
      return data?.value ?? null
    } catch {
      return null
    }
  }
  try { return localStorage.getItem(`mettel:setting:${key}`) } catch { return null }
}

export async function setSetting(key, value) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('settings').upsert({ key, value })
    if (error) throw error
    emit()
    return
  }
  try { localStorage.setItem(`mettel:setting:${key}`, value) } catch {}
  emit()
}

/* ---------------- helpers ---------------- */

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Build a unique product id from a base string. */
export function makeProductId(base, existing = []) {
  const root = slugify(base) || `item-${Date.now()}`
  if (!existing.includes(root)) return root
  let n = 2
  while (existing.includes(`${root}-${n}`)) n++
  return `${root}-${n}`
}
