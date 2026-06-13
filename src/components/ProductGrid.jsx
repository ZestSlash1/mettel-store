import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const [active, setActive] = useState(null) // null = all
  const { products, categories, loading, source } = useProducts({ category: active })

  return (
    <section id="products" className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
      {/* Section header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-3">Catalogue</div>
          <h2 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight sm:text-7xl">
            The
            <br />
            Lineup
          </h2>
        </div>

        {/* Category filter — pill control panel */}
        <div className="flex flex-wrap gap-2">
          <FilterPill label="All" active={active === null} onClick={() => setActive(null)} />
          {categories.map((c) => (
            <FilterPill
              key={c.id}
              label={c.label}
              active={active === c.id}
              onClick={() => setActive(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Data source hint (dev affordance) */}
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/30">
        Source: {source === 'supabase' ? 'Supabase (live)' : 'Local seed'} · {products.length} items
      </p>

      {/* Masonry grid via CSS columns; cards avoid breaking across columns */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-silver-200" />
          ))}
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
        active ? 'bg-flame-500 text-white' : 'bg-silver-200 text-ink hover:bg-ink hover:text-white'
      }`}
    >
      {label}
    </motion.button>
  )
}
