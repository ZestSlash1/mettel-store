import { forwardRef, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useCart } from '../context/CartContext'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { label: 'Info', to: '/about' },
  { label: 'News', to: '/news' },
  { label: 'Features', href: '/#features' },
  { label: 'Buy', href: '/#products' },
]

const MotionLink = motion(Link)

const Pill = forwardRef(function Pill(
  { children, href, to, variant = 'ghost', active = false, highlighted, className = '', onMouseEnter, onFocus },
  ref,
) {
  const base =
    'relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors duration-300 select-none'
  const variants = {
    // When `highlighted` is defined, a sibling sliding indicator owns the
    // background — this pill only ever toggles its text color.
    ghost:
      highlighted !== undefined
        ? highlighted ? 'text-[#fff]' : 'text-ink'
        : active
          ? 'bg-black text-[#fff]'
          : 'bg-transparent text-ink hover:bg-ink/[0.06]',
    solid: 'bg-black text-[#fff] hover:bg-flame-500',
    flame: 'bg-flame-500 text-[#fff] hover:bg-flame-600',
  }
  const cls = `${base} ${variants[variant]} ${className}`
  const motionProps = {
    whileHover: highlighted !== undefined ? undefined : { y: -1 },
    whileTap: { scale: 0.96 },
  }

  if (to) {
    return (
      <MotionLink ref={ref} to={to} {...motionProps} onMouseEnter={onMouseEnter} onFocus={onFocus} className={cls}>
        {children}
      </MotionLink>
    )
  }
  return (
    <motion.a ref={ref} href={href || '#'} {...motionProps} onMouseEnter={onMouseEnter} onFocus={onFocus} className={cls}>
      {children}
    </motion.a>
  )
})

/** Desktop primary nav — a liquid pill glides between links on hover/focus. */
function NavLinks({ location }) {
  const reduce = useReducedMotion()
  const containerRef = useRef(null)
  const itemRefs = useRef([])
  const [box, setBox] = useState(null) // { x, width } | null
  const [hoverIdx, setHoverIdx] = useState(null)

  const activeIdx = LINKS.findIndex((l) => l.to && location.pathname === l.to)
  const shownIdx = hoverIdx ?? (activeIdx >= 0 ? activeIdx : null)

  const measure = (idx) => {
    const el = itemRefs.current[idx]
    const container = containerRef.current
    if (!el || !container) return null
    const er = el.getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    return { x: er.left - cr.left, width: er.width }
  }

  useEffect(() => {
    setBox(shownIdx != null ? measure(shownIdx) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownIdx, location.pathname])

  return (
    <div
      ref={containerRef}
      className="relative hidden items-center gap-1 md:flex"
      onMouseLeave={() => setHoverIdx(null)}
    >
      {box ? (
        <motion.span
          className="absolute inset-y-0 left-0 z-0 rounded-full bg-black"
          initial={reduce ? { x: box.x, width: box.width, opacity: 1 } : false}
          animate={{ x: box.x, width: box.width, opacity: 1 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 38, mass: 0.7 }}
        />
      ) : null}
      {LINKS.map((l, i) => (
        <Pill
          key={l.label}
          ref={(el) => (itemRefs.current[i] = el)}
          to={l.to}
          href={l.href}
          highlighted={shownIdx === i}
          onMouseEnter={() => setHoverIdx(i)}
          onFocus={() => setHoverIdx(i)}
        >
          {l.label}
        </Pill>
      ))}
    </div>
  )
}

/** Magnetic CTA — pulls toward the cursor and sweeps a light through on hover. */
function DiscoverPill() {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState(false)
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springX = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 })
  const springY = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 })

  const handleMove = (e) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.28)
    my.set((e.clientY - (r.top + r.height / 2)) * 0.35)
  }
  const reset = () => {
    setHover(false)
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.a
      ref={ref}
      href="/#products"
      onMouseEnter={() => setHover(true)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.96 }}
      style={{ x: springX, y: springY }}
      className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-ink ring-1 ring-inset ring-ink/15"
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-flame-gradient"
        initial={false}
        animate={{ scaleX: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* light sweep */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-10 w-1/3 -skew-x-[20deg] bg-white/30"
        initial={{ x: '-150%' }}
        animate={{ x: hover ? '350%' : '-150%' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className={`relative z-10 transition-colors duration-300 ${hover ? 'text-[#fff]' : ''}`}>
        Discover All Products
      </span>
      <motion.span
        className="relative z-10 inline-block"
        animate={{ x: hover ? 4 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        →
      </motion.span>
    </motion.a>
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-black hover:text-[#fff]"
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
          className="rounded-full bg-black px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#fff] transition-colors hover:bg-flame-500"
        >
          Subscribe
        </a>
        <Link
          to="/account"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-silver-200 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-black hover:text-[#fff]"
        >
          Account
        </Link>
        <button
          onClick={handleCart}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-[#fff]"
          aria-label={`Open bag, ${count} items`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-flame-500 px-1 font-mono text-[10px] font-bold text-[#fff] ring-2 ring-silver">
              {count}
            </span>
          ) : null}
        </button>
        <ThemeToggle className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-[#fff]" />
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
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Prevent body scroll while mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Chrome tightens up + gains weight once the page has scrolled a touch.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-6"
      >
        <nav
          className={`mx-auto flex max-w-[1400px] items-center gap-2 rounded-full ring-1 ring-white/50 backdrop-blur-xl transition-[padding,box-shadow,background-color] duration-500 ease-out ${
            scrolled ? 'bg-white/90 p-1.5 shadow-soft-lg' : 'bg-white/70 p-2 shadow-soft'
          }`}
        >
          {/* Brand mark */}
          <Link to="/" className="flex shrink-0 items-center" aria-label="MetTel home">
            <motion.div whileHover={{ rotate: -6, scale: 1.05 }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Logo />
            </motion.div>
          </Link>

          {/* Primary links — desktop only */}
          <NavLinks location={location} />

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

            {/* Theme toggle — desktop only (mobile menu has its own) */}
            <ThemeToggle className="hidden h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-[#fff] md:flex" />

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-[#fff]"
              aria-label={`Open bag, ${count} items`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 ? (
                <span
                  key={count}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-badgepop items-center justify-center rounded-full bg-flame-500 px-1 font-mono text-[10px] font-bold text-[#fff] ring-2 ring-silver-50"
                >
                  {count}
                </span>
              ) : null}
            </button>

            {/* Account — desktop only (mobile menu has it) */}
            <Link
              to="/account"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-flame-500 hover:text-[#fff] md:flex"
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
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-silver-200 font-mono text-ink transition-colors hover:bg-flame-500 hover:text-[#fff] md:flex"
              aria-label="Catalogue admin"
              title="Catalogue admin"
            >
              #
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-silver-200 text-ink transition-colors hover:bg-black hover:text-[#fff] md:hidden"
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
