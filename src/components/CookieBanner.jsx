import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const LS_KEY = 'mettel:cookies:v1'

/**
 * Minimal GDPR/privacy cookie notice. Stores the user's choice in localStorage.
 * Accept — sets accepted flag; Decline — sets declined flag (no analytics loaded).
 * Either way the banner disappears for this browser.
 *
 * When you add analytics (GA4, Meta Pixel, etc.), gate those scripts behind
 * `localStorage.getItem('mettel:cookies:v1') === 'accepted'`.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after a short delay so it doesn't flash on initial load.
    const id = setTimeout(() => {
      if (!localStorage.getItem(LS_KEY)) setVisible(true)
    }, 800)
    return () => clearTimeout(id)
  }, [])

  const accept = () => { localStorage.setItem(LS_KEY, 'accepted'); setVisible(false) }
  const decline = () => { localStorage.setItem(LS_KEY, 'declined'); setVisible(false) }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-xl rounded-2xl bg-ink px-5 py-4 text-white shadow-2xl ring-1 ring-white/10 sm:bottom-6 sm:left-6 sm:right-auto"
          role="dialog"
          aria-label="Cookie notice"
        >
          <p className="font-mono text-[11px] leading-relaxed text-white/75">
            We use essential cookies to run the store. We may add analytics in the future.{' '}
            <Link to="/privacy" className="text-white/90 underline hover:text-flame-400">Privacy policy</Link>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={accept}
              className="rounded-full bg-flame-500 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-600"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="rounded-full bg-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/20"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
