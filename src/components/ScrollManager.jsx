import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll on navigation. On a route change it scrolls to the top; if the
 * URL carries a hash (e.g. /#products), it smooth-scrolls to that element
 * instead — which also makes cross-page anchor links land correctly.
 * Rendered once, inside the Router.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash])

  return null
}
