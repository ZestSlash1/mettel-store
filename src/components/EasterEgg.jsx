import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../lib/motion'

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']

/**
 * Zero-cost when not triggered: one console.log at mount, one keydown
 * listener. The payoff is a brief, on-brand overlay — gated by reduced
 * motion (falling glyphs skipped, message just fades).
 */
export default function EasterEgg() {
  const [open, setOpen] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    console.log(
      '%cMT // SYSTEM\n%cEngineered in the open — view-source if you like that sort of thing.\nHidden sequence: ↑ ↑ ↓ ↓ ← → ← → B A',
      'color:#ff6b00;font-weight:bold;font-family:monospace;font-size:12px',
      'color:#888;font-family:monospace;font-size:11px',
    )
    let buffer = []
    const onKey = (e) => {
      buffer = [...buffer, e.key.toLowerCase()].slice(-KONAMI.length)
      if (buffer.length === KONAMI.length && buffer.every((k, i) => k === KONAMI[i])) {
        setOpen(true)
        buffer = []
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 2600)
    return () => clearTimeout(t)
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-black/90"
        >
          {!reduced ? (
            <div aria-hidden="true" className="absolute inset-0">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute font-mono text-flame-500/70"
                  style={{
                    left: `${(i * 4.3) % 100}%`,
                    top: '-10%',
                    fontSize: `${10 + (i % 3) * 6}px`,
                    animation: `mt-fall ${1.6 + (i % 5) * 0.3}s linear ${i * 0.05}s 1 forwards`,
                  }}
                >
                  {'/>'}
                </span>
              ))}
            </div>
          ) : null}
          <div className="relative z-10 px-6 text-center font-mono uppercase tracking-[0.2em] text-[#fff]">
            <div className="text-2xl font-black text-flame-500">MT // ASSEMBLED</div>
            <div className="mt-2 text-[11px] text-[#fff]/60">12 parts. One standard. Thanks for poking around.</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
