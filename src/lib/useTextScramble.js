import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#0123456789'

/**
 * Resolves `text` from random glyph noise into its final value, used for
 * technical labels (spec values, SKUs, captions). Triggered on
 * scroll-into-view (once) or on hover, your call via `trigger`. Renders the
 * final text immediately under reduced motion — no scrambling, no flicker.
 */
export function useTextScramble(text, { trigger = 'view', duration = 480, fps = 24 } = {}) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(text)
  const playingRef = useRef(false)

  useEffect(() => {
    if (!playingRef.current) setDisplay(text)
  }, [text])

  function play() {
    if (playingRef.current || prefersReducedMotion()) return
    playingRef.current = true
    const totalFrames = Math.max(1, Math.round((duration / 1000) * fps))
    let frame = 0
    const interval = setInterval(() => {
      frame++
      const revealCount = Math.floor((frame / totalFrames) * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          out += ' '
        } else {
          out += i < revealCount ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
      }
      setDisplay(out)
      if (frame >= totalFrames) {
        clearInterval(interval)
        setDisplay(text)
        playingRef.current = false
      }
    }, 1000 / fps)
  }

  useEffect(() => {
    if (trigger !== 'view') return
    const el = ref.current
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play()
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text])

  return { ref, display, play }
}
