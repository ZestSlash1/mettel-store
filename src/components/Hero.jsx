import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { listCategories, subscribe, getSetting } from '../lib/dataStore'
import { gsap } from '../lib/gsap'
import { usePrefersReducedMotion } from '../lib/motion'
import { webglSupported } from '../lib/webgl'

// three.js + the exploded scene are code-split: only desktop, motion-enabled
// visitors ever download them, and never before first paint.
const ExplodedHero = lazy(() => import('./ExplodedHero'))

const FALLBACK_CATEGORIES = ['Coverage', 'Audio', 'Accessories', 'Lifestyle']

/** One headline line as an overflow-masked word so it can reveal upward. */
function HeadlineLine({ children, accent = false }) {
  return (
    <span className="block" style={{ clipPath: 'inset(0 -100vw 0 -100vw)' }}>
      <span
        data-hero-word
        className={`block ${accent ? 'text-flame-500' : 'text-ink'}`}
        style={{ willChange: 'transform' }}
      >
        {children}
      </span>
    </span>
  )
}

/** Small monospaced technical caption, revealed with the assembly. */
function TechLabel({ children, className = '' }) {
  return (
    <span
      data-hero-label
      className={`pointer-events-none font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45 ${className}`}
    >
      {children}
    </span>
  )
}

export default function Hero() {
  const reduced = usePrefersReducedMotion()
  const [isDesktop, setIsDesktop] = useState(false)
  const [categories, setCategories] = useState([])
  const [heroImage, setHeroImage] = useState(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [canvasFailed, setCanvasFailed] = useState(false)

  const sectionRef = useRef(null)
  const progress = useRef(0) // 0 exploded → 1 assembled, read by ExplodedHero each frame
  const cursor = useRef({ x: 0, y: 0 }) // -1..1, read by ExplodedHero each frame
  const [isLargeViewport, setIsLargeViewport] = useState(false)

  const useWebGL = isDesktop && !reduced && !canvasFailed && webglSupported()
  // Cursor-reactive lighting is the most performance-risky item in this
  // batch, so it gets its own narrower gate on top of useWebGL: a genuinely
  // large desktop viewport, never mobile/tablet, never reduced motion.
  const lightingEnabled = useWebGL && isLargeViewport

  // Track the desktop breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Narrower breakpoint gating cursor-reactive lighting on top of useWebGL.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const onChange = () => setIsLargeViewport(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Feed the live cursor position to the hero scene — only while the
  // lighting effect is actually enabled, so there's no listener cost at all
  // on mobile, tablet, or under reduced motion.
  useEffect(() => {
    if (!lightingEnabled) return
    const section = sectionRef.current
    const onMove = (e) => {
      const rect = section.getBoundingClientRect()
      cursor.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [lightingEnabled])

  // Live category strip + admin-configurable hero image.
  useEffect(() => {
    let active = true
    const load = () => {
      listCategories().then((cats) => {
        if (active) setCategories(cats.filter((c) => c.active !== false))
      })
      getSetting('hero_image').then((v) => {
        if (active) setHeroImage(v || null)
      })
    }
    load()
    const unsub = subscribe(load)
    return () => {
      active = false
      unsub()
    }
  }, [])

  const categoryLabels = categories.length ? categories.map((c) => c.label) : FALLBACK_CATEGORIES

  // Headline entrance (transform-only so it never delays LCP). Runs once on
  // mount unless reduced motion is set.
  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-word]', {
        yPercent: 115,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.1,
        delay: 0.1,
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [reduced])

  // Pinned scroll choreography — assembly scrub + label reveal. WebGL only.
  useEffect(() => {
    if (!useWebGL) {
      progress.current = 1 // poster fallback shows the assembled state
      return
    }
    const section = sectionRef.current
    const ctx = gsap.context(() => {
      const proxy = { v: 0 }
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=170%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })
      tl.to(proxy, { v: 1, ease: 'none', onUpdate: () => (progress.current = proxy.v) }, 0)
      tl.fromTo(
        '[data-hero-label]',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, ease: 'none', stagger: 0.15, duration: 0.5 },
        0.15,
      )
      // The static poster recedes as the live case takes over.
      tl.to('[data-hero-poster]', { autoAlpha: 0, ease: 'none', duration: 0.3 }, 0)
    }, section)
    return () => ctx.revert()
  }, [useWebGL])

  // Fallback path: gentle entrance for the labels (no scrub). Skipped when the
  // WebGL choreography owns them, and when reduced motion is set.
  useEffect(() => {
    if (useWebGL || reduced) return
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-label]', {
        autoAlpha: 0,
        y: 14,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.3,
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [useWebGL, reduced])

  const poster = (
    <img
      src={heroImage || '/hero-exploded.png'}
      alt="Mettel product — exploded view"
      className="h-full w-full object-contain"
    />
  )

  return (
    <section
      id="features"
      ref={sectionRef}
      className={`relative overflow-hidden ${useWebGL ? 'h-[100svh]' : 'min-h-[100svh]'}`}
    >
      {/* warm light pool */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-20 h-[120%] w-[60%] rounded-full bg-flame-gradient opacity-[0.10] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col px-4 pb-10 pt-28 sm:px-6 sm:pt-32 lg:pb-12">
        <div className="grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* ---- Text column ---- */}
          <div className="order-2 flex flex-col gap-7 lg:order-1 lg:col-span-5">
            <div className="eyebrow">MT // 001 — Engineered everyday objects</div>

            <h1 className="font-display text-display-lg font-black uppercase">
              <HeadlineLine>Engineered</HeadlineLine>
              <HeadlineLine>Everyday</HeadlineLine>
              <HeadlineLine accent>Objects.</HeadlineLine>
            </h1>

            <p className="max-w-md font-mono text-[12px] leading-relaxed text-ink/60">
              Considered objects, stripped to function — coverage, audio, accessories and lifestyle
              goods, built to one standard and priced direct.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
              {categoryLabels.map((label, i) => (
                <span key={label} className={i === 0 ? 'text-flame-600' : ''}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ---- Visual stage ---- */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] sm:max-w-[460px] lg:h-[70vh] lg:max-h-[640px] lg:max-w-none">
              {/* floor shadow */}
              <div className="absolute -bottom-2 left-1/2 h-8 w-1/2 -translate-x-1/2 rounded-full bg-ink/15 blur-2xl" />

              {/* static poster — paints instantly, recedes once the canvas is live */}
              <div
                data-hero-poster
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
                style={{ opacity: useWebGL && canvasReady ? 0 : 1 }}
              >
                <div className="h-[78%] w-auto">{poster}</div>
              </div>

              {/* live exploded-view canvas (desktop + motion only) */}
              {useWebGL ? (
                <Suspense fallback={null}>
                  <div
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: canvasReady ? 1 : 0 }}
                  >
                    <ExplodedHero
                      progressRef={progress}
                      cursorRef={lightingEnabled ? cursor : undefined}
                      onReady={() => setCanvasReady(true)}
                      onError={() => setCanvasFailed(true)}
                      className="h-full w-full"
                    />
                  </div>
                </Suspense>
              ) : null}

              {/* technical labels around the stage */}
              <TechLabel className="absolute left-0 top-2">Exploded view</TechLabel>
              <TechLabel className="absolute right-0 top-2 text-right">12 parts</TechLabel>
              <TechLabel className="absolute bottom-2 left-0">MT-CASE-ARAMID-001</TechLabel>
              <TechLabel className="absolute bottom-2 right-0 text-right">28.61°N / 77.20°E</TechLabel>
            </div>
          </div>
        </div>

        {/* ---- Bottom technical rail ---- */}
        <div className="rule mt-6 flex flex-wrap items-center justify-between gap-y-2 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45">
          <span>Mettel — est. 2024</span>
          <span className="hidden sm:inline">Designed in IN</span>
          <span className="hidden sm:inline">Multi-category</span>
          <span className="inline-flex items-center gap-2 text-ink/55">
            {useWebGL ? 'Scroll to assemble' : 'Now shipping'}
            <span aria-hidden="true">↓</span>
          </span>
        </div>
      </div>
    </section>
  )
}
