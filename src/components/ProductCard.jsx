import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ProductGraphic from './ProductGraphic'
import WishlistButton from './WishlistButton'
import { formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { isSoldOut } from '../lib/product'

const STATUS_LABEL = {
  available: 'In stock',
  preorder: 'Pre-order',
  soldout: 'Sold out',
}

export default function ProductCard({ product, index = 0 }) {
  const {
    name,
    tagline,
    price,
    currency,
    specs = [],
    color_hex,
    accent_hex,
    status,
    sku,
    image,
  } = product
  const { addItem } = useCart()
  const soldOut = isSoldOut(product)

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      variants={{ hover: { y: -6 } }}
      className="group relative flex break-inside-avoid flex-col overflow-hidden rounded-4xl bg-white shadow-soft ring-1 ring-ink/[0.04] transition-shadow duration-300 hover:shadow-soft-lg"
    >
      {/* Background shift on hover */}
      <motion.div
        variants={{ hover: { opacity: 1 } }}
        initial={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 bg-flame-soft"
      />

      {/* Visual well — links to detail page */}
      <Link to={`/product/${product.id}`} className="relative flex items-center justify-center overflow-hidden bg-silver-50/60 px-8 py-12">
        <motion.div
          variants={{ hover: { scale: 1.06, rotate: -1.5 } }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-[44%] min-w-[120px] drop-shadow-[0_20px_36px_rgba(0,0,0,0.18)]"
        >
          {image ? (
            <div className="aspect-[1/2] w-full">
              <img src={image} alt={name} className="h-full w-full object-contain" loading="lazy" />
            </div>
          ) : (
            <ProductGraphic className="h-auto w-full" shell={color_hex} accent={accent_hex} />
          )}
        </motion.div>

        {/* Status chip */}
        <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/70 ring-1 ring-ink/[0.04] backdrop-blur-sm">
          {soldOut ? 'Sold out' : STATUS_LABEL[status] ?? status}
        </span>

        {/* Wishlist */}
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} className="h-8 w-8 bg-white/80 hover:bg-white" />
        </div>
      </Link>

      {/* Spec body */}
      <div className="relative flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/product/${product.id}`}>
              <h3 className="font-display text-xl font-black uppercase leading-none tracking-tight transition-colors hover:text-flame-600">
                {name}
              </h3>
            </Link>
            <p className="mt-1.5 font-mono text-[11px] text-ink/60">{tagline}</p>
          </div>
          <span className="font-pixel text-base text-flame-600">{formatPrice(price, currency)}</span>
        </div>

        {/* Spec grid */}
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
            onClick={() => addItem(product, { model: product.models?.[0] ?? null })}
            className="btn btn-dark px-5 py-2 text-[10px]"
          >
            {soldOut ? 'Sold' : status === 'preorder' ? 'Pre-order' : 'Add'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
