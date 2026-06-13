import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PhoneCase from './PhoneCase'
import { formatPrice } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'

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

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      className="group relative flex break-inside-avoid flex-col overflow-hidden rounded-3xl bg-silver-50 ring-1 ring-ink/5"
    >
      {/* Background shift on hover */}
      <motion.div
        variants={{ hover: { opacity: 1 } }}
        initial={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 bg-flame-soft"
      />

      {/* Visual well — links to detail page */}
      <Link to={`/product/${product.id}`} className="relative flex items-center justify-center overflow-hidden px-8 py-12">
        <motion.div
          variants={{ hover: { scale: 1.06, rotate: -1.5 } }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-[44%] min-w-[120px] drop-shadow-[0_24px_40px_rgba(0,0,0,0.28)]"
        >
          {image ? (
            <img src={image} alt={name} className="h-auto w-full" loading="lazy" />
          ) : (
            <PhoneCase className="h-auto w-full" shell={color_hex} accent={accent_hex} />
          )}
        </motion.div>

        {/* Status chip */}
        <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white">
          {STATUS_LABEL[status] ?? status}
        </span>
      </Link>

      {/* Spec body */}
      <div className="relative flex flex-1 flex-col gap-4 border-t border-ink/10 p-5">
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
            <div key={s.k} className="flex justify-between gap-2 border-b border-dashed border-ink/15 pb-1">
              <dt className="text-ink/40">{s.k}</dt>
              <dd className="text-ink/80">{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35">{sku}</span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={status === 'soldout'}
            onClick={() => addItem(product, { model: product.models?.[0] ?? null })}
            className="rounded-full bg-ink px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === 'soldout' ? 'Sold' : status === 'preorder' ? 'Pre-order' : 'Add'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
