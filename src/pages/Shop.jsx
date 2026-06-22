import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import { useFlipGrid } from '../lib/useFlipGrid'

const SORTS = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
}

/**
 * Full catalogue page. The active category lives in the URL (?category=<id>)
 * so footer links like /shop?category=cases deep-link straight to a filter.
 * Search and sort are applied client-side over the loaded set.
 */
export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const { products, categories, loading } = useProducts({ category: active || undefined })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  const gridRef = useRef(null)

  const visible = useMemo(() => {
    let list = products
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p.name, p.tagline, p.sku].filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    }
    const by = {
      featured: (a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.rank ?? 0) - (b.rank ?? 0),
      newest: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      'price-asc': (a, b) => (a.price ?? 0) - (b.price ?? 0),
      'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
    }
    return [...list].sort(by[sort] || by.featured)
  }, [products, query, sort])

  const captureFlip = useFlipGrid(gridRef, visible)
  const setCategory = (id) => { captureFlip(); setParams(id ? { category: id } : {}) }

  return (
    <PageShell
      eyebrow="Catalogue"
      seoTitle="Shop"
      seoDescription="Browse the full Mettel lineup — coverage, audio, accessories, and lifestyle goods."
      title={<>The<br />Lineup</>}
      intro="Engineered objects across categories. Filter by genre, search, or browse the lot."
    >
      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterPill label="All" active={!active} onClick={() => setCategory(null)} />
        {categories.map((c) => (
          <FilterPill key={c.id} label={c.label} active={active === c.id} onClick={() => setCategory(c.id)} />
        ))}
      </div>

      {/* Search + sort */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => { captureFlip(); setQuery(e.target.value) }}
          placeholder="Search the lineup…"
          className="max-w-xs flex-1 rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[12px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500"
        />
        <select
          value={sort}
          onChange={(e) => { captureFlip(); setSort(e.target.value) }}
          className="rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[12px] text-ink outline-none focus:border-flame-500"
        >
          {Object.entries(SORTS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink/35">{visible.length} items</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-4xl bg-silver-200/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <p className="font-display text-xl font-black uppercase text-ink/70">Nothing here</p>
          <p className="mt-2 font-mono text-[11px] text-ink/45">
            {query ? 'No products match your search.' : 'No products in this category.'}
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn px-5 py-2 text-[11px] tracking-[0.18em] ${active ? 'btn-flame' : 'btn-soft'}`}
    >
      {label}
    </button>
  )
}
