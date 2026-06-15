import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import PhoneCase from '../components/PhoneCase'
import ProductCard from '../components/ProductCard'
import { useProducts, formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'

const STATUS_COPY = {
  available: 'In stock · ships in 2–4 days',
  preorder: 'Pre-order · ships next batch',
  soldout: 'Sold out',
}

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, loading } = useProducts()
  const { addItem } = useCart()

  const product = useMemo(() => products.find((p) => p.id === id), [products, id])
  const [model, setModel] = useState(null)

  useEffect(() => {
    setModel(product?.models?.[0] ?? null)
    window.scrollTo(0, 0)
  }, [product?.id])

  const related = useMemo(
    () => products.filter((p) => p.category_id === product?.category_id && p.id !== product?.id).slice(0, 3),
    [products, product],
  )
  const catLabel = categories.find((c) => c.id === product?.category_id)?.label

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="mx-auto max-w-[1200px] px-6 pt-32"><div className="h-96 animate-pulse rounded-3xl bg-silver-200" /></div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navigation />
        <div className="mx-auto flex min-h-[60vh] max-w-[1200px] flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-5xl font-black uppercase">Not found</h1>
          <p className="mt-2 font-mono text-[12px] text-ink/50">That product doesn’t exist or was removed.</p>
          <Link to="/" className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
            Back to store
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const soldout = product.status === 'soldout'

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
          <Link to="/" className="hover:text-ink">Store</Link>
          <span>/</span>
          <Link to="/#products" className="hover:text-ink">{catLabel}</Link>
          <span>/</span>
          <span className="text-ink/70">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Visual */}
          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-silver-50 p-10 ring-1 ring-ink/5">
            <div className="pointer-events-none absolute -right-20 top-0 h-full w-1/2 rotate-[18deg] bg-flame-gradient opacity-80" />
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[58%] max-w-[260px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.4)]"
            >
              {product.image ? (
                <div className="aspect-[1/2] w-full">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <PhoneCase className="h-auto w-full" shell={product.color_hex} accent={product.accent_hex} />
              )}
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="eyebrow mb-3">{catLabel} · {product.sku}</div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 font-mono text-sm text-ink/60">{product.tagline}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl font-black">{formatPrice(product.price, product.currency)}</span>
              <span className={`font-mono text-[11px] uppercase tracking-wider ${soldout ? 'text-ink/40' : 'text-flame-600'}`}>
                {STATUS_COPY[product.status]}
              </span>
            </div>

            {/* Model selector */}
            {product.models?.length ? (
              <div className="mt-8">
                <div className="eyebrow mb-2">Device</div>
                <div className="flex flex-wrap gap-2">
                  {product.models.map((m) => (
                    <button
                      key={m}
                      onClick={() => setModel(m)}
                      className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                        model === m ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Add to cart */}
            <div className="mt-8 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={soldout}
                onClick={() => addItem(product, { model })}
                className="flex-1 rounded-full bg-flame-500 py-4 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600 disabled:cursor-not-allowed disabled:bg-ink/20"
              >
                {soldout ? 'Sold out' : product.status === 'preorder' ? 'Pre-order' : 'Add to bag'}
              </motion.button>
            </div>

            {/* Spec sheet */}
            <div className="mt-10">
              <div className="eyebrow mb-3">Specification</div>
              <dl className="grid grid-cols-2 gap-x-8">
                {(product.specs || []).map((s) => (
                  <div key={s.k} className="flex justify-between gap-2 border-b border-dashed border-ink/15 py-2.5 font-mono text-[11px] uppercase tracking-wider">
                    <dt className="text-ink/40">{s.k}</dt>
                    <dd className="text-ink/80">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length ? (
          <section className="mt-24">
            <h2 className="mb-8 font-display text-3xl font-black uppercase tracking-tight">More in {catLabel}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
