import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { listCategories, subscribe, getSetting } from '../lib/dataStore'
import PhoneCase from './PhoneCase'

const FALLBACK_CATEGORIES = ['Coverage', 'Audio', 'Accessories', 'Lifestyle']

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

  // Category strip is built live from active categories (falls back to a
  // default set before they load or if none are configured).
  const [categories, setCategories] = useState([])
  const [heroImage, setHeroImage] = useState(null)

  useEffect(() => {
    let active = true
    const load = () =>
      listCategories().then((cats) => {
        if (active) setCategories(cats.filter((c) => c.active !== false))
      })
    load()
    getSetting('hero_image').then((v) => { if (active && v) setHeroImage(v) })
    const unsub = subscribe(() => {
      load()
      getSetting('hero_image').then((v) => { if (active) setHeroImage(v || null) })
    })
    return () => {
      active = false
      unsub()
    }
  }, [])
  const categoryLabels = categories.length ? categories.map((c) => c.label) : FALLBACK_CATEGORIES

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
      {/* ---- Background layer: faint mega-type watermark ---- */}
      <motion.h1
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-1/2 top-[32%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-mega font-black text-ink/[0.035]"
        aria-hidden="true"
      >
        MT
      </motion.h1>

      {/* ---- Background layer: soft warm light pool ---- */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-20 h-[120%] w-[60%] rounded-full bg-flame-gradient opacity-[0.12] blur-[90px]" />
      </div>

      {/* ---- Visible accessible heading (screen readers + SEO) ---- */}
      <h2 className="sr-only">MetTel — engineered everyday objects across categories</h2>

      {/* ---- Foreground content grid ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
      >
        {/* Left column — material spec + product story */}
        <div className="order-2 flex flex-col gap-10 lg:order-1 lg:col-span-4">
          <SpecBlock eyebrow="01 / Approach">
            Considered objects, stripped to function. No noise, no filler —
            <span className="text-ink"> the thing, done right.</span>
          </SpecBlock>
          <SpecBlock eyebrow="02 / Range">
            Coverage, audio, accessories, and lifestyle goods. One standard across every
            category — chosen to outlast the trend cycle, not chase it.
          </SpecBlock>

          <motion.div
            variants={rise}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50"
          >
            {categoryLabels.map((label, i) => (
              <span key={label} className={i === 0 ? 'text-flame-600' : ''}>{label}</span>
            ))}
          </motion.div>
        </div>

        {/* Center column — floating product */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <motion.div
            variants={rise}
            className="relative mx-auto w-[58%] min-w-[200px] max-w-[300px]"
          >
            {/* Floor shadow */}
            <div className="absolute -bottom-4 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-full bg-ink/15 blur-2xl" />
            <motion.div animate={float} className="relative drop-shadow-[0_30px_55px_rgba(0,0,0,0.25)]">
              {heroImage ? (
                <img src={heroImage} alt="MetTel product" className="h-auto w-full object-contain" />
              ) : (
                <PhoneCase className="h-auto w-full" shell="#cfcfcf" accent="#ff6b00" />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Right column — brand standard */}
        <div className="order-3 flex flex-col gap-10 lg:col-span-4 lg:items-end lg:text-right">
          <SpecBlock eyebrow="03 / Standard" className="lg:ml-auto">
            Every object held to one bar — materials chosen to last, finishes that age well,
            and direct pricing with no retail markup.
          </SpecBlock>

          <motion.ul
            variants={rise}
            className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-wider text-ink/70 lg:items-end"
          >
            {[
              'Designed in-house',
              'Built to last',
              'Direct-to-you pricing',
              'Worldwide shipping',
              'A growing range',
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
        <span>MetTel — est. 2024</span>
        <span>Now shipping</span>
        <span className="hidden sm:inline">Designed in IN</span>
        <span className="hidden sm:inline">Multi-category</span>
        <span>Everyday / Objects</span>
      </motion.div>
    </section>
  )
}
