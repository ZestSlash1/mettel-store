import { useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { useLenis } from './smoothScroll'
import { prefersReducedMotion } from './motion'

/**
 * Subtle skew tied to scroll speed — mutates the element's transform
 * directly off the GSAP ticker (no React re-render, no layout cost) so it
 * stays GPU-cheap under throttling. No-ops under reduced motion or when
 * Lenis isn't running (touch falls back to native scroll: velocity reads
 * ~0, which just means no skew — never an error).
 *
 * Apply the returned ref to a plain wrapper, not a Framer Motion element —
 * both would fight over the same `transform` property.
 */
export function useScrollVelocityTilt({ maxSkew = 5, sensitivity = 0.5 } = {}) {
  const ref = useRef(null)
  const lenis = useLenis()
  const current = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el || !lenis || prefersReducedMotion()) return

    const tick = () => {
      const velocity = lenis.velocity || 0
      const target = gsap.utils.clamp(-maxSkew, maxSkew, velocity * sensitivity)
      current.current += (target - current.current) * 0.15
      if (Math.abs(current.current) < 0.02) current.current = 0
      el.style.transform = current.current ? `skewY(${current.current.toFixed(2)}deg)` : ''
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      el.style.transform = ''
    }
  }, [lenis, maxSkew, sensitivity])

  return ref
}
