import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

const FAQS = [
  {
    q: 'Which devices do your cases fit?',
    a: 'Each product page lists its compatible devices in the spec sheet. We currently support recent iPhone and Pixel models, with more added regularly.',
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
    a: 'Every case carries a 12-month limited warranty against manufacturing defects. See the Warranty page, or email warranty@mettel.in to make a claim.',
  },
]

function Item({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-base font-black uppercase tracking-tight">{q}</span>
        <span className={`shrink-0 font-mono text-lg text-flame-500 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open ? (
        <p className="px-5 pb-5 font-mono text-[12px] leading-relaxed text-ink/60">{a}</p>
      ) : null}
    </div>
  )
}

export default function FAQ() {
  return (
    <PageShell
      eyebrow="Support / FAQ"
      seoTitle="FAQ"
      seoDescription="Answers to common questions about MetTel orders, shipping, returns, and warranty."
      title={<>FAQ</>}
      intro="Quick answers to the questions we get most. Still stuck? Reach our team on the Contact page."
    >
      <div className="space-y-3">
        {FAQS.map((f) => (
          <Item key={f.q} {...f} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-ink p-6 text-center text-silver">
        <p className="font-mono text-[12px] text-silver/70">Didn’t find your answer?</p>
        <Link
          to="/contact"
          className="mt-3 inline-block rounded-full bg-flame-500 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-flame-600"
        >
          Contact us →
        </Link>
      </div>
    </PageShell>
  )
}
