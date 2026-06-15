import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import Logo from './Logo'

// Anchors (/#…) jump to home sections; `to` paths are real routes.
const LINKS = [
  { label: 'Info', to: '/about' },
  { label: 'News', to: '/news' },
  { label: 'Features', href: '/#features' },
  { label: 'Buy', href: '/#products' },
]

const MotionLink = motion(Link)

/**
 * Reusable pill. Pass `to` for an in-app route (React Router) or `href` for a
 * hash anchor / external link. `variant` controls the look:
 *  - 'ghost'  : transparent, hover fills light
 *  - 'solid'  : black
 *  - 'flame'  : orange accent
 */
function Pill({ children, href, to, variant = 'ghost', active = false, className = '' }) {
  const base =
    'relative inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors duration-200 select-none'
  const variants = {
    ghost: active
      ? 'bg-ink text-white'
      : 'bg-transparent text-ink hover:bg-ink/[0.06]',
    solid: 'bg-ink text-white hover:bg-flame-500',
    flame: 'bg-flame-500 text-white hover:bg-flame-600',
  }
  const cls = `${base} ${variants[variant]} ${className}`
  const motionProps = { whileHover: { y: -1 }, whileTap: { scale: 0.97 } }

  if (to) {
    return <MotionLink to={to} {...motionProps} className={cls}>{children}</MotionLink>
  }
  return <motion.a href={href || '#'} {...motionProps} className={cls}>{children}</motion.a>
}

/**
 * The signature "Discover All Products" control: a transparent pill whose
 * dashed border continuously marches, and fills with flame on hover.
 */
function DiscoverPill() {
  const [hover, setHover] = useState(false)
  return (
    <a
      href="/#products"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative inline-flex items-center gap-3 rounded-full px-7 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-ink overflow-hidden"
    >
      {/* Animated dashed border (SVG so the dashes can march).
          Geometry attrs can't use calc(), so we draw a full-size rect and let
          the parent's overflow-hidden clip the half-stroke cleanly. */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="9999"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 5"
          className={hover ? '' : 'animate-dash-march'}
        />
      </svg>
      {/* Flame fill that wipes in on hover */}
      <motion.span
        className="absolute inset-0 rounded-full bg-flame-gradient"
        initial={false}
        animate={{ scaleX: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className={`relative z-10 transition-colors ${hover ? 'text-white' : ''}`}>
        Discover All Products
      </span>
      <motion.span
        className="relative z-10 inline-block"
        animate={{ x: hover ? 3 : 0 }}
        transition={{ duration: 0.3 }}
      >
        →
      </motion.span>
    </a>
  )
}

export default function Navigation() {
  const { count, openCart } = useCart()
  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-6"
    >
      <nav className="mx-auto flex max-w-[1400px] items-center gap-2 rounded-full bg-silver-50/85 p-2 shadow-panel ring-1 ring-ink/5 backdrop-blur-md">
        {/* Brand mark */}
        <Link to="/" className="flex shrink-0 items-center" aria-label="MetTel home">
          <Logo />
        </Link>

        {/* Primary links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Pill key={l.label} to={l.to} href={l.href}>
              {l.label}
            </Pill>
          ))}
        </div>

        {/* Discover — signature dashed control */}
        <div className="ml-auto hidden lg:block">
          <DiscoverPill />
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Pill href="/#subscribe" variant="solid">
            Subscribe
          </Pill>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-white"
            aria-label={`Open bag, ${count} items`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-flame-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-silver-50">
                {count}
              </span>
            ) : null}
          </button>

          <Link
            to="/admin"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 font-mono text-ink transition-colors hover:bg-flame-500 hover:text-white"
            aria-label="Catalogue admin"
            title="Catalogue admin"
          >
            #
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}
