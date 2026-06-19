import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLenis } from '../lib/smoothScroll'

/**
 * Resets scroll on navigation. On a route change it jumps to the top; if the
 * URL carries a hash (e.g. /#products), it smooth-scrolls to that element
 * instead — which also makes cross-page anchor links land correctly.
 *
 * When smooth scrolling is active the moves are routed through Lenis; otherwise
 * (reduced-motion / before Lenis mounts) it falls back to the native browser
 * scroll. Rendered once, inside the Router.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  const lenis = useLenis()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -80 })
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash, lenis])

  return null
}
