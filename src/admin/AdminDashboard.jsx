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
import Overview from './Overview'
import CouponManager from './CouponManager'
import ReviewsManager from './ReviewsManager'
import SubscribersManager from './SubscribersManager'
import StockNotificationsManager from './StockNotificationsManager'
import StorefrontSettings from './StorefrontSettings'
import { Btn } from './ui'
import { useAuth } from '../context/AuthContext'

// Sidebar navigation, grouped like a modern store admin. Each item carries a
// small inline icon. Counts are injected at render time.
const ICONS = {
  storefront: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  overview: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  products: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.3 7 12 12l8.7-5 M12 22V12',
  categories: 'M4 6h16M4 12h16M4 18h16',
  orders: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
  coupons: 'M9 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4 M9 3v18',
  reviews: 'M12 2 15 9l7 .5-5.5 4.5L18 21l-6-3.5L6 21l1.5-7L2 9.5 9 9z',
  subscribers: 'M4 4h16v16H4z M22 6l-10 7L2 6',
  'stock-alerts': 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
}

const NAV_GROUPS = [
  {
    heading: 'Catalogue',
    items: [
      ['overview', 'Dashboard'],
      ['storefront', 'Storefront'],
      ['products', 'Products'],
      ['categories', 'Categories'],
    ],
  },
  {
    heading: 'Sales',
    items: [
      ['orders', 'Orders'],
      ['coupons', 'Coupons'],
    ],
  },
  {
    heading: 'Engagement',
    items: [
      ['reviews', 'Reviews'],
      ['subscribers', 'Subscribers'],
      ['stock-alerts', 'Stock alerts'],
    ],
  },
]

const TAB_TITLES = {
  overview: 'Dashboard',
  storefront: 'Storefront',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  coupons: 'Coupons',
  reviews: 'Reviews',
  subscribers: 'Subscribers',
  'stock-alerts': 'Stock alerts',
}

function NavIcon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(ICONS[name] || '').split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  )
}

export default function AdminDashboard() {
  const { products, categories, loading } = useProducts()
  const { user, signOut, authEnabled } = useAuth()
  const [tab, setTab] = useState('overview')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // product | {} (new) | null (closed)
  const fileRef = useRef(null)

  const visible = filter === 'all' ? products : products.filter((p) => p.category_id === filter)
  const existingIds = products.map((p) => p.id)

  const counts = { products: products.length, categories: categories.length }

  /* ---- product mutations ---- */
  const saveProduct = async (p) => {
    await upsertProduct(p)
    setEditing(null)
  }
  const duplicateProduct = async (p) => {
    const copy = { ...p, id: '', name: `${p.name} Copy`, sku: `${p.sku}-COPY` }
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
    <div className="flex min-h-screen bg-silver">
      {/* ---- Sidebar (desktop) ---- */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/[0.06] bg-white/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-white">
            <span className="font-display text-xs font-black">MT</span>
          </div>
          <div>
            <div className="font-display text-base font-black uppercase leading-none tracking-tight">Control</div>
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink/40">Store admin</div>
          </div>
        </div>

        {/* Data-source badge */}
        <div className="px-5 pb-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-wider ${
              dataSource === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-flame-100 text-flame-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dataSource === 'supabase' ? 'bg-green-500' : 'bg-flame-500'}`} />
            {dataSource === 'supabase' ? 'Supabase · live' : 'Local · browser'}
          </span>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="px-2 pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30">{group.heading}</div>
              <div className="space-y-0.5">
                {group.items.map(([key, label]) => {
                  const active = tab === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-[12px] tracking-wide transition-colors ${
                        active ? 'bg-ink text-white' : 'text-ink/70 hover:bg-ink/[0.05]'
                      }`}
                    >
                      <NavIcon name={key} />
                      <span className="flex-1">{label}</span>
                      {counts[key] != null ? (
                        <span className={`font-mono text-[10px] ${active ? 'text-white/60' : 'text-ink/35'}`}>{counts[key]}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        {authEnabled && user ? (
          <div className="border-t border-ink/[0.06] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-silver-200 font-mono text-[11px] uppercase text-ink/60">
                {(user.email || '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[10px] text-ink/60">{user.email}</div>
              </div>
              <button onClick={signOut} className="font-mono text-[9px] uppercase tracking-wider text-ink/40 hover:text-flame-600" title="Sign out">
                Exit
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-silver/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/40">
              Pages / <span className="text-ink">{TAB_TITLES[tab]}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {dataSource === 'local' ? (
                <>
                  <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
                  <Btn variant="ghost" onClick={() => fileRef.current?.click()}>Import</Btn>
                  <Btn variant="ghost" onClick={handleExport}>Export JSON</Btn>
                  <Btn variant="ghost" onClick={handleReset}>Reset</Btn>
                </>
              ) : null}
              <Link to="/" className="btn btn-dark px-4 py-2 text-[11px]">
                View store
              </Link>
            </div>
          </div>

          {/* Mobile nav — horizontal scroll (sidebar is hidden under lg) */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {NAV_GROUPS.flatMap((g) => g.items).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  tab === key ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* Body */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6">
          {loading ? (
            <div className="h-64 animate-pulse rounded-4xl bg-silver-200/60" />
          ) : tab === 'overview' ? (
            <Overview />
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
          ) : tab === 'storefront' ? (
            <StorefrontSettings />
          ) : tab === 'coupons' ? (
            <CouponManager />
          ) : tab === 'reviews' ? (
            <ReviewsManager />
          ) : tab === 'subscribers' ? (
            <SubscribersManager />
          ) : tab === 'stock-alerts' ? (
            <StockNotificationsManager />
          ) : (
            <OrdersTable />
          )}
        </main>
      </div>

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
                products={products}
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
      className={`btn px-4 py-1.5 text-[11px] tracking-[0.16em] ${active ? 'btn-flame' : 'btn-soft'}`}
    >
      {children}
    </button>
  )
}
