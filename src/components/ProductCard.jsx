import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ProductGraphic from './ProductGraphic'
import WishlistButton from './WishlistButton'
import { formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { isSoldOut } from '../lib/product'
import { EASE } from '../lib/motion'

const STATUS_LABEL = {
  available: 'In stock',
  preorder: 'Pre-order',
  soldout: 'Sold out',
}

export default function ProductCard({ product, index = 0 }) {
  const { name, tagline, price, currency, specs = [], color_hex, accent_hex, status, sku, image } = product
  const { addItem } = useCart()
  const reduce = useReducedMotion()
  const soldOut = isSoldOut(product)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (soldOut) return
    addItem(product, { model: product.models?.[0] ?? null })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const num = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: EASE.out }}
      whileHover={reduce ? undefined : 'hover'}
      variants={{ hover: { y: -6 } }}
      className="group relative flex break-inside-avoid flex-col overflow-hidden rounded-4xl bg-white shadow-soft ring-1 ring-ink/[0.04] transition-shadow duration-500 hover:shadow-soft-lg"
    >
      {/* hover wash */}
      <motion.div
        variants={{ hover: { opacity: 1 } }}
        initial={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-0 bg-flame-soft"
      />

      {/* ---- visual well ---- */}
      <div className="relative flex items-center justify-center overflow-hidden bg-silver-50/60 px-8 py-12">
        {/* index tag */}
        <span className="absolute left-4 top-4 z-20 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/30">
          /{num}
        </span>

        {/* status chip */}
        <span className="absolute bottom-4 left-4 z-20 rounded-full bg-white/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/70 ring-1 ring-ink/[0.04] backdrop-blur-sm">
          {soldOut ? 'Sold out' : STATUS_LABEL[status] ?? status}
        </span>

        {/* wishlist — sits above the stretched link so it isn't nested in it */}
        <div className="absolute right-3 top-3 z-20">
          <WishlistButton productId={product.id} className="h-8 w-8 bg-white/80 hover:bg-white" />
        </div>

        {/* product visual */}
        <motion.div
          variants={{ hover: { scale: 1.07, rotate: -2 } }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative z-10 w-[46%] min-w-[120px] drop-shadow-[0_20px_36px_rgba(0,0,0,0.18)]"
        >
          {image ? (
            <div className="aspect-[1/2] w-full">
              <img src={image} alt={name} className="h-full w-full object-contain" loading="lazy" />
            </div>
          ) : (
            <ProductGraphic className="h-auto w-full" shell={color_hex} accent={accent_hex} />
          )}
        </motion.div>

        {/* hover reveal strip */}
        <motion.div
          variants={{ hover: { y: 0 } }}
          initial={{ y: '101%' }}
          transition={{ duration: 0.32, ease: EASE.out }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between bg-ink/90 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white"
        >
          <span>View product</span>
          <span aria-hidden="true">→</span>
        </motion.div>

        {/* stretched mouse-nav link (keyboard users use the title link below) */}
        <Link
          to={`/product/${product.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 z-10"
        />
      </div>

      {/* ---- spec body ---- */}
      <div className="relative z-10 flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/product/${product.id}`}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-flame-500/60"
            >
              <h3 className="font-display text-xl font-black uppercase leading-none tracking-tight transition-colors group-hover:text-flame-600">
                {name}
              </h3>
            </Link>
            <p className="mt-1.5 font-mono text-[11px] text-ink/60">{tagline}</p>
          </div>
          <span className="font-pixel text-base text-flame-600">{formatPrice(price, currency)}</span>
        </div>

        {/* spec grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-wider">
          {specs.slice(0, 4).map((s) => (
            <div key={s.k} className="flex justify-between gap-2 border-b border-ink/[0.06] pb-1">
              <dt className="text-ink/40">{s.k}</dt>
              <dd className="text-ink/80">{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35">{sku}</span>
          <button
            disabled={soldOut}
            onClick={handleAdd}
            aria-label={soldOut ? 'Sold out' : `Add ${name} to bag`}
            className={`btn px-5 py-2 text-[10px] ${added ? 'btn-flame animate-addpop' : 'btn-dark'}`}
          >
            {soldOut ? 'Sold' : added ? 'Added ✓' : status === 'preorder' ? 'Pre-order' : 'Add'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
