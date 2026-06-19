import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import Logo from './Logo'

const LINKS = [
  { label: 'Info', to: '/about' },
  { label: 'News', to: '/news' },
  { label: 'Features', href: '/#features' },
  { label: 'Buy', href: '/#products' },
]

const MotionLink = motion(Link)

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

function DiscoverPill() {
  const [hover, setHover] = useState(false)
  return (
    <a
      href="/#products"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-ink"
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <rect
          x="0" y="0" width="100%" height="100%" rx="9999"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeDasharray="6 5"
          className={hover ? '' : 'animate-dash-march'}
        />
      </svg>
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
      <motion.span className="relative z-10 inline-block" animate={{ x: hover ? 3 : 0 }} transition={{ duration: 0.3 }}>
        →
      </motion.span>
    </a>
  )
}

/** Full-screen mobile menu overlay. */
function MobileMenu({ onClose }) {
  const { count, openCart } = useCart()

  const handleCart = () => { onClose(); openCart() }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      data-lenis-prevent
      className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-silver/97 backdrop-blur-xl"
    >
      {/* Top bar mirrors the nav */}
      <div className="flex items-center justify-between px-5 pt-5">
        <Link to="/" onClick={onClose} aria-label="MetTel home">
          <Logo />
        </Link>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-ink hover:text-white"
          aria-label="Close menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main links */}
      <nav className="flex flex-1 flex-col justify-center gap-1 px-5 py-8">
        {LINKS.map((l, i) => (
          <motion.div
            key={l.label}
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {l.to ? (
              <Link
                to={l.to}
                onClick={onClose}
                className="block py-3 font-display text-4xl font-black uppercase tracking-tight text-ink transition-colors hover:text-flame-500"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                onClick={onClose}
                className="block py-3 font-display text-4xl font-black uppercase tracking-tight text-ink transition-colors hover:text-flame-500"
              >
                {l.label}
              </a>
            )}
          </motion.div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 px-5 py-6">
        <a
          href="/#subscribe"
          onClick={onClose}
          className="rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-500"
        >
          Subscribe
        </a>
        <Link
          to="/account"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-silver-200 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Account
        </Link>
        <button
          onClick={handleCart}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-white"
          aria-label={`Open bag, ${count} items`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-flame-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-silver">
              {count}
            </span>
          ) : null}
        </button>
        <Link
          to="/admin"
          onClick={onClose}
          className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35 hover:text-ink"
        >
          Admin →
        </Link>
      </div>
    </motion.div>
  )
}

export default function Navigation() {
  const { count, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Prevent body scroll while mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <motion.header
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-6"
      >
        <nav className="mx-auto flex max-w-[1400px] items-center gap-2 rounded-full bg-white/70 p-2 shadow-soft ring-1 ring-white/50 backdrop-blur-xl">
          {/* Brand mark */}
          <Link to="/" className="flex shrink-0 items-center" aria-label="MetTel home">
            <Logo />
          </Link>

          {/* Primary links — desktop only */}
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Pill key={l.label} to={l.to} href={l.href}>
                {l.label}
              </Pill>
            ))}
          </div>

          {/* Discover — large screens */}
          <div className="ml-auto hidden lg:block">
            <DiscoverPill />
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            {/* Subscribe — desktop only */}
            <div className="hidden md:block">
              <Pill href="/#subscribe" variant="solid">Subscribe</Pill>
            </div>

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

            {/* Account — desktop only (mobile menu has it) */}
            <Link
              to="/account"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-white md:flex"
              aria-label="Your account"
              title="Account"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Admin — desktop only */}
            <Link
              to="/admin"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-silver-200 font-mono text-ink transition-colors hover:bg-flame-500 hover:text-white md:flex"
              aria-label="Catalogue admin"
              title="Catalogue admin"
            >
              #
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-ink hover:text-white md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
