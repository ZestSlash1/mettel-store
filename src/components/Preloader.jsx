import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE, DUR, usePrefersReducedMotion } from '../lib/motion'

const COUNT_MS = 1400

/**
 * One-time boot screen — mounted once at the app root, never on route
 * navigations. Locks scroll for its duration so the curtain-rise exit
 * doesn't reveal a page mid-scroll.
 */
export default function Preloader() {
  const [done, setDone] = useState(false)
  const [count, setCount] = useState(0)
  const reduced = usePrefersReducedMotion()
  const rafRef = useRef()
  const holdRef = useRef()

  useEffect(() => {
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    if (reduced) {
      setCount(100)
      holdRef.current = setTimeout(() => setDone(true), 300)
      return () => {
        clearTimeout(holdRef.current)
        html.style.overflow = prevOverflow
      }
    }

    const start = performance.now()
    const finish = () => setDone(true)
    const tick = (now) => {
      const p = Math.min(1, (now - start) / COUNT_MS)
      setCount(Math.round(p * 100))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        holdRef.current = setTimeout(finish, 250)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    // rAF is throttled to near-zero in a backgrounded/hidden tab (e.g. opened
    // in a new tab the user hasn't switched to yet) — this guarantees the
    // overlay and scroll lock can never get stuck indefinitely.
    const safety = setTimeout(finish, COUNT_MS + 600)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(holdRef.current)
      clearTimeout(safety)
      html.style.overflow = prevOverflow
    }
  }, [reduced])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ y: reduced ? 0 : '-100%', opacity: reduced ? 0 : 1 }}
          transition={{ duration: reduced ? DUR.fast : DUR.slow, ease: EASE.outExpo }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-silver-50"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver-50/40">
            MT // Initializing
          </div>
          <div className="mt-3 font-display text-6xl font-black tabular-nums sm:text-8xl">
            {String(count).padStart(2, '0')}
          </div>
          <div className="mt-6 h-px w-40 overflow-hidden bg-silver-50/15">
            <div className="h-full bg-flame-500" style={{ width: `${count}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
