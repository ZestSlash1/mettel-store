import { Children, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * Momentum horizontal rail. Mouse drags with inertia + snap-to-item on
 * release; touch keeps native momentum scrolling (CSS scroll-snap handles
 * the snap there for free). Arrow keys move focus one item at a time.
 * Each item should be given a width that leaves the next item peeking in
 * (e.g. `w-[78%] sm:w-[42%]`) via `itemClassName` — never a hard crop.
 */
export default function DraggableCarousel({ children, itemClassName = '', className = '', ariaLabel = 'Carousel' }) {
  const scrollerRef = useRef(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, vel: 0, moved: 0 })
  const reduce = usePrefersReducedMotion()
  const items = Children.toArray(children)

  const itemEls = () => Array.from(scrollerRef.current?.children || [])

  const snapTo = (index, smooth = true) => {
    const el = scrollerRef.current
    const target = itemEls()[Math.max(0, Math.min(items.length - 1, index))]
    if (!el || !target) return
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: smooth && !reduce ? 'smooth' : 'auto' })
  }

  const nearestIndex = () => {
    const el = scrollerRef.current
    if (!el) return 0
    let best = 0
    let bestDist = Infinity
    itemEls().forEach((node, i) => {
      const dist = Math.abs(node.offsetLeft - el.offsetLeft - el.scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') return // native momentum handles touch
    const el = scrollerRef.current
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), vel: 0, moved: 0 }
    el.setPointerCapture?.(e.pointerId)
    el.style.scrollSnapType = 'none'
    el.style.cursor = 'grabbing'
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.active) return
    const el = scrollerRef.current
    const dx = e.clientX - d.startX
    el.scrollLeft = d.startScroll - dx
    d.moved += Math.abs(e.clientX - d.lastX)
    const now = performance.now()
    const dt = now - d.lastT
    if (dt > 0) d.vel = (e.clientX - d.lastX) / dt
    d.lastX = e.clientX
    d.lastT = now
  }

  const onPointerUp = (e) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    const el = scrollerRef.current
    el.style.cursor = 'grab'
    el.releasePointerCapture?.(e.pointerId)

    // A real drag, not a click — swallow the click so the card's link doesn't navigate.
    if (d.moved > 6) {
      el.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation() }, { capture: true, once: true })
    }

    if (reduce) {
      el.style.scrollSnapType = 'x mandatory'
      snapTo(nearestIndex())
      return
    }

    let velocity = -d.vel * 1000 // px/sec
    if (Math.abs(velocity) < 40) {
      el.style.scrollSnapType = 'x mandatory'
      snapTo(nearestIndex())
      return
    }
    const step = () => {
      velocity *= 0.92
      el.scrollLeft += velocity / 60
      if (Math.abs(velocity) > 20) {
        requestAnimationFrame(step)
      } else {
        el.style.scrollSnapType = 'x mandatory'
        snapTo(nearestIndex())
      }
    }
    requestAnimationFrame(step)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      snapTo(nearestIndex() + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      snapTo(nearestIndex() - 1)
    }
  }

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-12 cursor-grab outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-flame-500/50 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {items.map((child, i) => (
        <div key={child.key ?? i} className={`snap-start shrink-0 ${itemClassName}`}>
          {child}
        </div>
      ))}
    </div>
  )
}
