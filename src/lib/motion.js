/**
 * Motion design tokens — the single source of truth for easing and timing.
 *
 * One easing vocabulary, reused everywhere (Framer Motion, GSAP, raw CSS) so
 * the whole site moves with the same intent:
 *   - `out`      the house curve: crisp, confident settle (default for most UI)
 *   - `outExpo`  long, cinematic deceleration (scroll reveals, hero)
 *   - `inOut`    symmetric ease for moves that travel a distance
 *   - `outBack`  a touch of overshoot, used sparingly for playful pops
 *
 * Durations follow the brief: hovers are fast (~150–250ms), scroll reveals are
 * slower and cinematic.
 */
import { useEffect, useState } from 'react'

// Framer Motion / cubic-bezier control points.
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  outBack: [0.34, 1.56, 0.64, 1],
}

// The same curves as CSS strings (for inline styles / transitions).
export const EASE_CSS = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  outBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

// Closest GSAP built-in eases (no extra plugin needed) for the same intent.
export const GSAP_EASE = {
  out: 'power3.out',
  outExpo: 'expo.out',
  inOut: 'power2.inOut',
  outBack: 'back.out(1.7)',
}

// Seconds (GSAP / Framer use seconds).
export const DUR = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
  cinematic: 1.1,
}

export const STAGGER = {
  tight: 0.05,
  base: 0.08,
  loose: 0.12,
}

/** Imperative check — use inside effects, GSAP setup, three.js, etc. */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Reactive version for components that need to re-render on preference change. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}
