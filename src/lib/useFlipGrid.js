import { useLayoutEffect, useRef } from 'react'
import { gsap, Flip } from './gsap'
import { GSAP_EASE, DUR, STAGGER, prefersReducedMotion } from './motion'

/**
 * Animates a filtered/sorted grid's re-layout with GSAP Flip instead of a
 * hard re-render snap. Call `capture()` synchronously inside the event
 * handler that's about to change the list (before the state setter), then
 * pass the resulting list to this hook — it Flips from the pre-change
 * layout to the new one on the next commit.
 *
 * Items leaving the list fade + scale out (Flip re-inserts their detached
 * DOM nodes long enough to animate); items entering fade + scale in.
 * No-ops under reduced motion — the grid just re-renders instantly.
 *
 * @param {React.RefObject} gridRef  ref on the grid container
 * @param {Array}           list     the rendered list (deps trigger on identity change)
 */
export function useFlipGrid(gridRef, list) {
  const stateRef = useRef(null)

  function capture() {
    if (gridRef.current && !prefersReducedMotion()) {
      stateRef.current = Flip.getState(gridRef.current.children)
    }
  }

  useLayoutEffect(() => {
    const state = stateRef.current
    stateRef.current = null
    if (!state || !gridRef.current) return

    Flip.from(state, {
      targets: gridRef.current.children,
      duration: DUR.slow,
      ease: GSAP_EASE.out,
      stagger: STAGGER.tight,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: DUR.base, stagger: STAGGER.tight }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: DUR.fast }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  return capture
}
