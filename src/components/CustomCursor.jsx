import { useEffect, useRef, useState } from 'react'

const LABELS = { drag: 'DRAG', view: 'VIEW', add: 'ADD' }

/**
 * Contextual cursor — desktop only (`pointer: fine`; mobile/touch keep the
 * native cursor untouched). Position is written straight to the DOM via
 * `style.transform` on every pointermove, no React re-render per move.
 * State (default/drag/view/add) comes from the nearest ancestor carrying
 * `data-cursor="<state>"`, toggled via a CSS class so transitions are pure
 * CSS (instant under reduced motion).
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const pos = useRef({ x: -100, y: -100 })
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState('default')

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('cursor-none')

    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      const el = dotRef.current
      if (el) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
    }
    const over = (e) => {
      const target = e.target.closest?.('[data-cursor]')
      setState(target?.dataset.cursor || 'default')
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    return () => {
      document.documentElement.classList.remove('cursor-none')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
      style={{ transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)` }}
    >
      <div
        className={`flex items-center justify-center rounded-full font-mono text-[9px] uppercase tracking-[0.18em] transition-all duration-200 motion-reduce:transition-none ${
          state === 'view'
            ? 'h-14 w-14 bg-white text-ink shadow-soft'
            : state === 'add'
              ? 'h-12 w-12 bg-flame-500 text-[#fff]'
              : state === 'drag'
                ? 'h-12 w-12 bg-black text-[#fff]'
                : 'h-2.5 w-2.5 bg-ink'
        }`}
      >
        {LABELS[state] || ''}
      </div>
    </div>
  )
}
