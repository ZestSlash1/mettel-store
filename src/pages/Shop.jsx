import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'

/**
 * Full catalogue page. The active category lives in the URL (?category=<id>)
 * so footer links like /shop?category=cases deep-link straight to a filter.
 */
export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const { products, categories, loading } = useProducts({ category: active || undefined })

  const setCategory = (id) => setParams(id ? { category: id } : {})

  return (
    <PageShell
      eyebrow="Catalogue"
      seoTitle="Shop"
      seoDescription="Browse the full MetTel lineup of engineered phone covers and accessories."
      title={<>The<br />Lineup</>}
      intro="Engineered coverage and accessories. Filter by category, or browse the lot."
    >
      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill label="All" active={!active} onClick={() => setCategory(null)} />
        {categories.map((c) => (
          <FilterPill key={c.id} label={c.label} active={active === c.id} onClick={() => setCategory(c.id)} />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-silver-200" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-silver-50 p-12 text-center">
          <p className="font-display text-xl font-black uppercase text-ink/70">Nothing here yet</p>
          <p className="mt-2 font-mono text-[11px] text-ink/45">No products in this category.</p>
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </PageShell>
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
