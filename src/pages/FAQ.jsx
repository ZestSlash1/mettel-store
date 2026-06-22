import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell'
import { EASE, DUR } from '../lib/motion'

const FAQS = [
  {
    q: 'What kind of products do you sell?',
    a: 'Mettel carries engineered everyday objects across categories — phone coverage, audio, accessories, and lifestyle goods — all held to the same design standard. Browse the Shop to filter by category.',
  },
  {
    q: 'How do I know an item fits my device or needs?',
    a: 'Each product page lists its full spec sheet — compatible devices, sizes, or variants where relevant. If anything’s unclear, ask us on the Contact page before you buy.',
  },
  {
    q: 'How long does delivery take?',
    a: 'In-stock orders dispatch within 2 business days. Domestic delivery lands in 3–6 business days; international in 7–14. See the Shipping page for details.',
  },
  {
    q: 'What’s your return policy?',
    a: 'Unused items can be returned within 14 days of delivery for a full refund. Start a return by emailing returns@mettel.in with your order ID.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. Payments are processed by Razorpay over an encrypted connection. We never see or store your card details.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We ship worldwide via tracked courier. Import duties or taxes, where they apply, are charged on delivery by your local customs.',
  },
  {
    q: 'How does the warranty work?',
    a: 'Every product carries a 12-month limited warranty against manufacturing defects. See the Warranty page, or email warranty@mettel.in to make a claim.',
  },
]

function Item({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div data-reveal className="card-soft overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-silver-50/60"
        aria-expanded={open}
      >
        <span className="font-display text-base font-black uppercase tracking-tight">{q}</span>
        <span className={`shrink-0 font-mono text-lg text-flame-500 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.fast, ease: EASE.out }}
          >
            <p className="px-5 pb-5 font-mono text-[12px] leading-relaxed text-ink/60">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  return (
    <PageShell
      eyebrow="Support / FAQ"
      seoTitle="FAQ"
      seoDescription="Answers to common questions about Mettel orders, shipping, returns, and warranty."
      title={<>FAQ</>}
      intro="Quick answers to the questions we get most. Still stuck? Reach our team on the Contact page."
    >
      <div className="space-y-3">
        {FAQS.map((f) => (
          <Item key={f.q} {...f} />
        ))}
      </div>

      <div data-reveal className="mt-10 rounded-4xl bg-black p-6 text-center text-[#fff] shadow-soft">
        <p className="font-mono text-[12px] text-[#fff]/70">Didn’t find your answer?</p>
        <Link
          to="/contact"
          className="btn btn-flame mt-3 inline-flex px-6 py-3 text-[11px]"
        >
          Contact us →
        </Link>
      </div>
    </PageShell>
  )
}
