import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useProducts } from '../hooks/useProducts'
import {
  upsertProduct,
  deleteProduct,
  upsertCategory,
  deleteCategory,
  exportData,
  importData,
  resetToSeed,
  dataSource,
} from '../lib/dataStore'
import ProductsTable from './ProductsTable'
import ProductForm from './ProductForm'
import CategoryManager from './CategoryManager'
import OrdersTable from './OrdersTable'
import { Btn } from './ui'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { products, categories, loading } = useProducts()
  const { user, signOut, authEnabled } = useAuth()
  const [tab, setTab] = useState('products') // products | categories | orders
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // product | {} (new) | null (closed)
  const fileRef = useRef(null)

  const visible = filter === 'all' ? products : products.filter((p) => p.category_id === filter)
  const existingIds = products.map((p) => p.id)

  /* ---- product mutations ---- */
  const saveProduct = async (p) => {
    await upsertProduct(p)
    setEditing(null)
  }
  const duplicateProduct = async (p) => {
    const copy = {
      ...p,
      id: '', // gets a fresh unique id in the form/store
      name: `${p.name} Copy`,
      sku: `${p.sku}-COPY`,
    }
    setEditing(copy)
  }
  const removeProduct = async (p) => {
    if (confirm(`Delete “${p.name}”? This can't be undone.`)) await deleteProduct(p.id)
  }

  /* ---- local-mode data ops ---- */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(JSON.parse(reader.result))
      } catch (err) {
        alert(`Import failed: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const handleReset = () => {
    if (confirm('Reset all data back to the original seed? Your local changes will be lost.')) resetToSeed()
  }

  return (
    <div className="min-h-screen bg-silver">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-silver-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
            <span className="font-display text-xs font-black">MT</span>
          </div>
          <div>
            <div className="font-display text-lg font-black uppercase leading-none tracking-tight">Control</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Catalogue admin</div>
          </div>

          <span
            className={`ml-2 rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-wider ${
              dataSource === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-flame-100 text-flame-700'
            }`}
          >
            {dataSource === 'supabase' ? 'Supabase · live' : 'Local · browser'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {dataSource === 'local' ? (
              <>
                <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
                <Btn variant="ghost" onClick={() => fileRef.current?.click()}>Import</Btn>
                <Btn variant="ghost" onClick={handleExport}>Export JSON</Btn>
                <Btn variant="ghost" onClick={handleReset}>Reset</Btn>
              </>
            ) : null}
            <Link to="/" className="rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-500">
              View store
            </Link>
            {authEnabled && user ? (
              <div className="flex items-center gap-2">
                <span className="hidden font-mono text-[10px] text-ink/40 sm:inline">{user.email}</span>
                <Btn variant="ghost" onClick={signOut}>Sign out</Btn>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-[1200px] gap-2 px-4 pb-3 sm:px-6">
          {[
            ['products', `Products (${products.length})`],
            ['categories', `Categories (${categories.length})`],
            ['orders', 'Orders'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === key ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-silver-200" />
        ) : tab === 'products' ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Pill active={filter === 'all'} onClick={() => setFilter('all')}>All</Pill>
                {categories.map((c) => (
                  <Pill key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</Pill>
                ))}
              </div>
              <Btn variant="flame" onClick={() => setEditing({})}>+ New product</Btn>
            </div>
            <ProductsTable
              products={visible}
              categories={categories}
              onEdit={setEditing}
              onDuplicate={duplicateProduct}
              onDelete={removeProduct}
            />
          </>
        ) : tab === 'categories' ? (
          <CategoryManager
            categories={categories}
            products={products}
            onSave={upsertCategory}
            onDelete={deleteCategory}
          />
        ) : (
          <OrdersTable />
        )}
      </main>

      {/* Slide-over product form */}
      <AnimatePresence>
        {editing !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
            <div className="relative h-full">
              <ProductForm
                product={editing && Object.keys(editing).length ? editing : null}
                categories={categories}
                existingIds={existingIds}
                onSave={saveProduct}
                onCancel={() => setEditing(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
        active ? 'bg-flame-500 text-white' : 'bg-silver-200 text-ink hover:bg-ink hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
