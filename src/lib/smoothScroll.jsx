import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './motion'

/**
 * App-wide smooth scrolling (Lenis) kept in lock-step with GSAP ScrollTrigger.
 *
 * Design decisions:
 *  - Smooth wheel only. Touch keeps native momentum (`syncTouch: false`) so the
 *    choreography never fights a phone's flick-scroll.
 *  - Disabled entirely under prefers-reduced-motion — the page falls back to the
 *    browser's own instant scrolling and every ScrollTrigger still works.
 *  - The live Lenis instance is shared via context so <ScrollManager> can route
 *    programmatic scrolls (top-on-navigate, hash links) through it.
 *
 * Inner scroll areas (cart drawer, modals) must carry `data-lenis-prevent` so
 * their wheel events don't bubble up into the page scroll.
 */
const LenisContext = createContext(null)

export function useLenis() {
  return useContext(LenisContext)
}

export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      // No smooth scroll; make sure triggers measure against native scroll.
      ScrollTrigger.refresh()
      return
    }

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      syncTouch: false,
    })
    setLenis(instance)

    // Drive Lenis from GSAP's ticker and update triggers on every scroll.
    instance.on('scroll', ScrollTrigger.update)
    const raf = (time) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
