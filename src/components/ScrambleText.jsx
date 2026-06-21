import { useTextScramble } from '../lib/useTextScramble'

/**
 * Drop-in for any short technical label (spec value, SKU, caption).
 * `trigger="view"` (default) plays once when scrolled into view;
 * `trigger="hover"` replays on every mouse-enter.
 */
export default function ScrambleText({ text, as: Tag = 'span', trigger = 'view', duration, className = '' }) {
  const value = text == null ? '' : String(text)
  const { ref, display, play } = useTextScramble(value, { trigger, duration })
  const hoverProps = trigger === 'hover' ? { onMouseEnter: play } : {}
  return (
    <Tag ref={ref} className={className} {...hoverProps}>
      {display}
    </Tag>
  )
}
