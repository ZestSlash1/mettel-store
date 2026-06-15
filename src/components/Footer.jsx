import { Link } from 'react-router-dom'

// Each footer link points at a real route. Phone Covers/Accessories deep-link
// to the Shop page pre-filtered by category id (cases / accessories).
const COLUMNS = [
  {
    h: 'Shop',
    items: [
      { label: 'Phone Covers', to: '/shop?category=cases' },
      { label: 'Accessories', to: '/shop?category=accessories' },
      { label: 'Gift Cards', to: '/gift-cards' },
    ],
  },
  {
    h: 'Company',
    items: [
      { label: 'About', to: '/about' },
      { label: 'News', to: '/news' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    h: 'Support',
    items: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Shipping', to: '/shipping' },
      { label: 'Returns', to: '/returns' },
      { label: 'Warranty', to: '/warranty' },
    ],
  },
]

export default function Footer() {
  return (
    <footer id="info" className="mx-auto max-w-[1400px] px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-3xl bg-ink p-8 text-silver sm:p-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="font-display text-4xl font-black tracking-tight transition-colors hover:text-flame-500">
              METTEL
            </Link>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/60">
              Engineered coverage for the device you carry everywhere. Built in India. Shipped
              worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.h}>
                <div className="mb-3 text-flame-500">{col.h}</div>
                <ul className="space-y-2 text-silver/55">
                  {col.items.map((i) => (
                    <li key={i.label}>
                      <Link to={i.to} className="transition-colors hover:text-white">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-silver/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
          <span>© {new Date().getFullYear()} MetTel · mettel.in</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms</Link>
            <span className="hidden sm:inline">Made for the everyday object</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
