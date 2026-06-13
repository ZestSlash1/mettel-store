import { motion, useReducedMotion } from 'framer-motion'
import PhoneCase from './PhoneCase'

/* Staggered upward reveal for text clusters on load */
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}
const rise = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

/* Small reusable spec block in the spec-sheet voice */
function SpecBlock({ eyebrow, children, className = '' }) {
  return (
    <motion.div variants={rise} className={`max-w-[15rem] ${className}`}>
      <div className="eyebrow mb-2">{eyebrow}</div>
      <p className="font-mono text-[11px] leading-relaxed text-ink/70">{children}</p>
    </motion.div>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()

  const float = reduce
    ? {}
    : {
        y: [0, -16, 0],
        rotate: [-1, 1, -1],
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <section
      id="features"
      className="relative mx-auto min-h-[100svh] max-w-[1400px] overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32"
    >
      {/* ---- Background layer: mega type ---- */}
      <motion.h1
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-1/2 top-[32%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-mega font-black text-ink"
        aria-hidden="true"
      >
        MT
      </motion.h1>

      {/* ---- Background layer: orange gradient slash + pixel accent ---- */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-24 top-10 h-[140%] w-[55%] rotate-[18deg] bg-flame-gradient opacity-90 blur-[1px]" />
        {/* Pixel-block accent, echoing the TE question-mark blocks */}
        <div className="absolute right-[14%] top-[18%] grid grid-cols-4 gap-1.5 opacity-90">
          {[1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1].map((on, i) => (
            <span
              key={i}
              className={`h-3 w-3 ${on ? 'bg-flame-700' : 'bg-transparent'}`}
            />
          ))}
        </div>
      </div>

      {/* ---- Visible accessible heading (screen readers + SEO) ---- */}
      <h2 className="sr-only">MetTel — engineered phone covers and accessories</h2>

      {/* ---- Foreground content grid ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
      >
        {/* Left column — material spec + product story */}
        <div className="order-2 flex flex-col gap-10 lg:order-1 lg:col-span-4">
          <SpecBlock eyebrow="01 / Material">
            Woven aramid fiber shell at <span className="text-ink">0.95 mm</span>. Machined
            buttons, bare-metal port cutouts, zero printed graphics.
          </SpecBlock>
          <SpecBlock eyebrow="02 / Construction">
            Single-piece monocoque. Shock channels routed into the corners. Built to outlive the
            device it protects, not the trend cycle.
          </SpecBlock>

          <motion.div variants={rise} className="flex flex-wrap items-center gap-3 pt-2">
            <span className="font-pixel text-2xl text-flame-600">2499</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
              ₹ / INR — in stock
            </span>
          </motion.div>
        </div>

        {/* Center column — floating product */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <motion.div
            variants={rise}
            className="relative mx-auto w-[58%] min-w-[200px] max-w-[300px]"
          >
            {/* Floor shadow */}
            <div className="absolute -bottom-4 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-full bg-ink/25 blur-2xl" />
            <motion.div animate={float} className="relative drop-shadow-[0_40px_60px_rgba(0,0,0,0.4)]">
              <PhoneCase className="h-auto w-full" shell="#cfcfcf" accent="#ff6b00" />
            </motion.div>
          </motion.div>
        </div>

        {/* Right column — connectivity / device spec */}
        <div className="order-3 flex flex-col gap-10 lg:col-span-4 lg:items-end lg:text-right">
          <SpecBlock eyebrow="03 / Compatibility" className="lg:ml-auto">
            iPhone 16 Pro · iPhone 16 · Pixel 9 Pro. MagSafe-aligned magnet array. Wireless
            charging passthrough, no cutout.
          </SpecBlock>

          <motion.ul
            variants={rise}
            className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-wider text-ink/70 lg:items-end"
          >
            {[
              '600D aramid weave',
              'MIL-STD 3 m drop',
              '14 g total weight',
              'CNC button array',
              'Anti-yellow coating',
            ].map((spec) => (
              <li key={spec} className="flex items-center gap-2">
                <span className="text-flame-500">+</span> {spec}
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>

      {/* ---- Bottom technical label rail ---- */}
      <motion.div
        variants={rise}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-12 flex flex-wrap items-center justify-between gap-y-2 rule pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45"
      >
        <span>MT-CASE-ARAMID-001</span>
        <span>Now available</span>
        <span className="hidden sm:inline">Designed in IN</span>
        <span className="hidden sm:inline">One of a kind</span>
        <span>Coverage / Device</span>
      </motion.div>
    </section>
  )
}
