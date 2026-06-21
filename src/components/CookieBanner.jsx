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

  // Notify same-tab listeners (e.g. the product page's sticky buy bar, which
  // waits for this to clear before claiming the bottom of the screen).
  const dismiss = (choice) => {
    localStorage.setItem(LS_KEY, choice)
    setVisible(false)
    window.dispatchEvent(new Event('mettel:cookie'))
  }
  const accept = () => dismiss('accepted')
  const decline = () => dismiss('declined')

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-xl rounded-2xl bg-black px-5 py-4 text-[#fff] shadow-2xl ring-1 ring-[#fff]/10 sm:bottom-6 sm:left-6 sm:right-auto"
          role="dialog"
          aria-label="Cookie notice"
        >
          <p className="font-mono text-[11px] leading-relaxed text-[#fff]/75">
            We use essential cookies to run the store. We may add analytics in the future.{' '}
            <Link to="/privacy" className="text-[#fff]/90 underline hover:text-flame-400">Privacy policy</Link>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={accept}
              className="rounded-full bg-flame-500 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-flame-600"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="rounded-full bg-[#fff]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#fff]/70 transition-colors hover:bg-[#fff]/20"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
