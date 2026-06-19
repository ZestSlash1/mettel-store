import { useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { GSAP_EASE, DUR, STAGGER, prefersReducedMotion } from './motion'

/**
 * Scroll-reveal a section as it enters the viewport.
 *
 * Built on `gsap.from`, so the natural DOM is the FINAL state: if JavaScript
 * fails or the user prefers reduced motion, the content is simply visible with
 * no setup styles left behind. Returns a ref to attach to the section.
 *
 * If the section contains `[data-reveal]` children they animate in a directional
 * stagger; otherwise the section itself reveals as one.
 *
 * @param {Object}  [o]
 * @param {number}  [o.y]             starting y-offset (px)
 * @param {number}  [o.duration]      seconds
 * @param {string}  [o.ease]          GSAP ease
 * @param {number}  [o.stagger]       seconds between children
 * @param {string}  [o.start]         ScrollTrigger start (default 'top 85%')
 * @param {string}  [o.childSelector] selector for staggered children
 */
export function useScrollReveal(o = {}) {
  const ref = useRef(null)
  const {
    y = 28,
    opacity = 0,
    duration = DUR.slow,
    ease = GSAP_EASE.out,
    stagger = STAGGER.base,
    start = 'top 85%',
    childSelector = '[data-reveal]',
  } = o

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const children = el.querySelectorAll(childSelector)
    const targets = children.length ? children : [el]

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        opacity,
        duration,
        ease,
        stagger: children.length ? stagger : 0,
        scrollTrigger: { trigger: el, start, once: true },
      })
    }, el)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
