import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import ProductGraphic from '../components/ProductGraphic'
import ProductCard from '../components/ProductCard'
import { useProducts, formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { isSoldOut } from '../lib/product'

const STATUS_COPY = {
  available: 'In stock · ships in 2–4 days',
  preorder: 'Pre-order · ships next batch',
  soldout: 'Sold out',
}

/** Derive the full gallery array from a product, deduplicating image + images. */
function galleryOf(product) {
  const arr = Array.isArray(product.images) && product.images.length
    ? product.images
    : product.image
      ? [product.image]
      : []
  // Deduplicate while preserving order.
  return [...new Map(arr.map((u) => [u, u])).values()]
}

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, loading } = useProducts()
  const { addItem } = useCart()

  const product = useMemo(() => products.find((p) => p.id === id), [products, id])
  const [model, setModel] = useState(null)
  const [activeImg, setActiveImg] = useState(null)

  useEffect(() => {
    setModel(product?.models?.[0] ?? null)
    setActiveImg(null) // reset gallery selection on product change
    window.scrollTo(0, 0)
  }, [product?.id])

  const gallery = useMemo(() => product ? galleryOf(product) : [], [product])
  const displayImg = activeImg ?? gallery[0] ?? null

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
          <p className="mt-2 font-mono text-[12px] text-ink/50">That product doesn't exist or was removed.</p>
          <Link to="/" className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
            Back to store
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const soldout = isSoldOut(product)

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.tagline || undefined,
    sku: product.sku,
    image: gallery[0] || undefined,
    brand: { '@type': 'Brand', name: 'MetTel' },
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency || 'INR',
      price: product.price,
      availability: soldout ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `https://www.mettel.in/product/${product.id}`,
    },
  }

  return (
    <>
      <Seo title={product.name} description={product.tagline} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
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
          {/* Visual + gallery */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-silver-50 p-10 ring-1 ring-ink/5">
              <div className="pointer-events-none absolute -right-20 top-0 h-full w-1/2 rotate-[18deg] bg-flame-gradient opacity-80" />
              <motion.div
                key={displayImg}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-[58%] max-w-[260px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.4)]"
              >
                {displayImg ? (
                  <div className="aspect-[1/2] w-full">
                    <img src={displayImg} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <ProductGraphic className="h-auto w-full" shell={product.color_hex} accent={product.accent_hex} />
                )}
              </motion.div>
            </div>

            {/* Thumbnail strip — only if there are 2+ images */}
            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setActiveImg(url)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                      (displayImg === url || (i === 0 && !activeImg))
                        ? 'ring-flame-500'
                        : 'ring-ink/10 hover:ring-ink/30'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={url} alt="" className="h-full w-full object-contain bg-silver-50" />
                  </button>
                ))}
              </div>
            ) : null}
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
                {soldout ? 'Sold out' : STATUS_COPY[product.status]}
              </span>
            </div>

            {/* Model selector */}
            {product.models?.length ? (
              <div className="mt-8">
                <div className="eyebrow mb-2">Variant</div>
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

            {/* Add to cart / sold-out notify */}
            <div className="mt-8 flex gap-3">
              {soldout ? (
                <NotifyForm productId={product.id} />
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addItem(product, { model })}
                  className="flex-1 rounded-full bg-flame-500 py-4 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600"
                >
                  {product.status === 'preorder' ? 'Pre-order' : 'Add to bag'}
                </motion.button>
              )}
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

/** Email sign-up shown when a product is sold out. */
function NotifyForm({ productId }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/notify-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setDone(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex-1 rounded-2xl bg-silver-100 px-5 py-4 ring-1 ring-ink/10">
        <p className="font-mono text-[11px] text-ink/70">You're on the list. We'll email you when this is back in stock.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-2">
      <p className="font-mono text-[11px] text-ink/50">Sold out — join the waitlist to be first to know:</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-3 font-mono text-sm text-ink outline-none placeholder:text-ink/30 focus:border-flame-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-500 disabled:opacity-50"
        >
          {busy ? '…' : 'Notify me'}
        </button>
      </div>
      {err ? <p className="font-mono text-[10px] text-flame-700">{err}</p> : null}
    </form>
  )
}
