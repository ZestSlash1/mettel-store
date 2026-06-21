import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import ProductGraphic from '../components/ProductGraphic'
import ProductCard from '../components/ProductCard'
import WishlistButton from '../components/WishlistButton'
import ProductReviews from '../components/ProductReviews'
import { useProducts, formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { isSoldOut } from '../lib/product'
import { BUSINESS } from '../config/business'
import { EASE } from '../lib/motion'

const VIEWED_KEY = 'mettel:viewed'
const MAX_VIEWED = 6

function pushViewed(id) {
  try {
    const prev = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]')
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_VIEWED)
    localStorage.setItem(VIEWED_KEY, JSON.stringify(next))
  } catch {}
}

function getViewed() {
  try { return JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]') } catch { return [] }
}

function youtubeEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null
}

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

/** Section wrapper that fades + rises into view (no-op under reduced motion). */
function Reveal({ children, className = '', as: Tag = motion.section }) {
  return (
    <Tag
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE.out }}
      className={className}
    >
      {children}
    </Tag>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, loading } = useProducts()
  const { addItem } = useCart()
  const reduce = useReducedMotion()

  const product = useMemo(() => products.find((p) => p.id === id), [products, id])
  const [model, setModel] = useState(null)
  const [activeImg, setActiveImg] = useState(null)
  const [activeVideo, setActiveVideo] = useState(false)
  const [qty, setQty] = useState(1)
  const [pincode, setPincode] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState(null) // null | 'ok' | 'no'
  const [recentIds, setRecentIds] = useState([])
  const [justAdded, setJustAdded] = useState(false)
  const [showBar, setShowBar] = useState(false)
  // The sticky buy bar waits for the cookie banner to be dismissed so the two
  // fixed-bottom elements never overlap on a first mobile visit.
  const [cookieClear, setCookieClear] = useState(() => {
    try { return !!localStorage.getItem('mettel:cookies:v1') } catch { return true }
  })

  const buyRef = useRef(null)

  useEffect(() => {
    const onConsent = () => setCookieClear(true)
    window.addEventListener('mettel:cookie', onConsent)
    return () => window.removeEventListener('mettel:cookie', onConsent)
  }, [])

  // Pointer tilt for the main visual (desktop, motion only).
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rxS = useSpring(rx, { stiffness: 150, damping: 18 })
  const ryS = useSpring(ry, { stiffness: 150, damping: 18 })
  const onTilt = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 16)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 16)
  }
  const resetTilt = () => {
    rx.set(0)
    ry.set(0)
  }

  useEffect(() => {
    setModel(product?.models?.[0] ?? null)
    setActiveImg(null)
    setActiveVideo(false)
    setQty(1)
    setPincode('')
    setPincodeStatus(null)
    window.scrollTo(0, 0)
    if (product?.id) {
      pushViewed(product.id)
      setRecentIds(getViewed())
    }
  }, [product?.id])

  // Show the sticky mobile buy bar once the main buy block scrolls out of view.
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), {
      rootMargin: '0px 0px -10% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [product?.id])

  const gallery = useMemo(() => product ? galleryOf(product) : [], [product])
  const displayImg = activeImg ?? gallery[0] ?? null

  const related = useMemo(
    () => products.filter((p) => p.category_id === product?.category_id && p.id !== product?.id).slice(0, 3),
    [products, product],
  )
  const recentlyViewed = useMemo(
    () => recentIds.filter((rid) => rid !== product?.id).map((rid) => products.find((p) => p.id === rid)).filter(Boolean).slice(0, 4),
    [recentIds, products, product?.id],
  )
  const catLabel = categories.find((c) => c.id === product?.category_id)?.label

  const checkPincode = () => {
    const codes = BUSINESS.serviceablePincodes
    if (!codes?.length) return
    setPincodeStatus(codes.includes(pincode.trim()) ? 'ok' : 'no')
  }

  const embedUrl = product ? youtubeEmbedUrl(product.video_url) : null

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

  const doAdd = () => {
    addItem(product, { model, qty })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1400)
  }

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
          <Link to="/shop" className="hover:text-ink">{catLabel}</Link>
          <span>/</span>
          <span className="text-ink/70">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Visual + gallery */}
          <div className="flex flex-col gap-3">
            {/* Main image / video */}
            <div
              onPointerMove={onTilt}
              onPointerLeave={resetTilt}
              className="relative flex items-center justify-center overflow-hidden rounded-4xl bg-white p-10 shadow-soft ring-1 ring-ink/[0.04] [perspective:1100px]"
            >
              <div className="pointer-events-none absolute -right-32 -top-10 h-[120%] w-1/2 rounded-full bg-flame-gradient opacity-[0.10] blur-3xl" />
              {/* corner registration marks — technical detail */}
              <span className="pointer-events-none absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/25">{product.sku}</span>
              {activeVideo && embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    title={`${product.name} video`}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full rounded-2xl"
                  />
                </div>
              ) : (
                <motion.div
                  style={{ rotateX: rxS, rotateY: ryS, transformPerspective: 1100 }}
                  className="relative w-[58%] max-w-[260px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.4)]"
                >
                  <motion.div
                    key={displayImg}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.35, ease: EASE.out }}
                  >
                    {displayImg ? (
                      <div className="aspect-[1/2] w-full">
                        <img src={displayImg} alt={product.name} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <ProductGraphic className="h-auto w-full" shell={product.color_hex} accent={product.accent_hex} />
                    )}
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Thumbnail strip — images + optional video thumb */}
            {(gallery.length > 1 || embedUrl) ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => { setActiveImg(url); setActiveVideo(false) }}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                      !activeVideo && (displayImg === url || (i === 0 && !activeImg))
                        ? 'ring-flame-500'
                        : 'ring-ink/10 hover:ring-ink/30'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={url} alt="" className="h-full w-full object-contain bg-silver-50" />
                  </button>
                ))}
                {embedUrl ? (
                  <button
                    onClick={() => setActiveVideo(true)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${activeVideo ? 'ring-flame-500' : 'ring-ink/10 hover:ring-ink/30'}`}
                    aria-label="Play video"
                  >
                    <div className="flex h-full w-full items-center justify-center bg-ink">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="eyebrow mb-3">{catLabel} · {product.sku}</div>
            <h1 className="font-display text-display-md font-black uppercase leading-[0.85] tracking-tight">
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
                      className={`rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                        model === m ? 'bg-ink text-white' : 'bg-silver-200 text-ink hover:bg-ink/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Pincode serviceability */}
            {BUSINESS.serviceablePincodes?.length ? (
              <div className="mt-6">
                <div className="eyebrow mb-2">Check delivery</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPincodeStatus(null) }}
                    placeholder="Enter pincode"
                    className="w-36 rounded-full border border-ink/15 bg-white px-4 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-ink/30 focus:border-flame-500"
                  />
                  <button
                    onClick={checkPincode}
                    disabled={pincode.length < 6}
                    className="rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-500 disabled:opacity-40"
                  >
                    Check
                  </button>
                </div>
                {pincodeStatus === 'ok' && (
                  <p className="mt-2 font-mono text-[11px] text-green-600">Delivery available to {pincode}</p>
                )}
                {pincodeStatus === 'no' && (
                  <p className="mt-2 font-mono text-[11px] text-flame-600">Sorry, we don't deliver to {pincode} yet</p>
                )}
              </div>
            ) : null}

            {/* Quantity + Add to cart / sold-out notify */}
            <div ref={buyRef} className="mt-8 flex flex-col gap-3">
              {soldout ? (
                <NotifyForm productId={product.id} />
              ) : (
                <>
                  {/* Qty stepper */}
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full bg-white ring-1 ring-ink/10">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-full font-mono text-xl text-ink/60 hover:bg-ink/5"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-mono text-base">{qty}</span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        className="flex h-11 w-11 items-center justify-center rounded-full font-mono text-xl text-ink/60 hover:bg-ink/5"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={doAdd}
                      className={`btn flex-1 py-3 text-[12px] tracking-[0.18em] ${justAdded ? 'btn-dark animate-addpop' : 'btn-flame'}`}
                    >
                      {justAdded ? 'Added ✓' : product.status === 'preorder' ? 'Pre-order' : 'Add to bag'}
                    </button>
                  </div>
                </>
              )}

              {/* Secondary actions */}
              <div className="flex gap-2">
                <WishlistButton
                  productId={product.id}
                  className="h-11 w-11 rounded-full bg-silver-100 hover:bg-silver-200"
                />
                <ShareButton name={product.name} />
              </div>
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

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related */}
        {related.length ? (
          <Reveal className="mt-24">
            <h2 className="mb-8 font-display text-display-md font-black uppercase tracking-tight">More in {catLabel}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </Reveal>
        ) : null}

        {/* Recently viewed */}
        {recentlyViewed.length ? (
          <Reveal className="mt-20">
            <h2 className="mb-8 font-display text-3xl font-black uppercase tracking-tight">Recently viewed</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyViewed.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </Reveal>
        ) : null}
      </main>
      <Footer />

      {/* Sticky mobile buy bar */}
      <AnimatePresence>
        {showBar && cookieClear ? (
          <motion.div
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ duration: 0.3, ease: EASE.out }}
            className="frost fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 px-4 py-3 lg:hidden"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto flex max-w-[1200px] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-black uppercase leading-none">{product.name}</div>
                <div className="mt-0.5 font-pixel text-sm text-flame-600">{formatPrice(product.price, product.currency)}</div>
              </div>
              {soldout ? (
                <button
                  onClick={() => buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="btn btn-dark ml-auto px-6 py-3 text-[12px]"
                >
                  Notify me
                </button>
              ) : (
                <button onClick={doAdd} className={`btn btn-flame ml-auto px-6 py-3 text-[12px] ${justAdded ? 'animate-addpop' : ''}`}>
                  {justAdded ? 'Added ✓' : 'Add to bag'}
                </button>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

/** Web Share API button with copy-URL fallback. */
function ShareButton({ name }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
      } catch {
        // User cancelled — no-op
      }
      return
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      onClick={share}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-silver-100 text-ink/40 transition-colors hover:bg-silver-200 hover:text-ink"
      aria-label="Share product"
      title={copied ? 'Link copied!' : 'Share'}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
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
      const res = await fetch('/api/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notify-stock', productId, email: email.trim() }),
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
