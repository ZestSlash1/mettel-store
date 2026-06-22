import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCategories, subscribe } from '../lib/dataStore'

// Company/Support are fixed routes. The Shop column is built live from the
// categories table so new genres (audio, lifestyle, …) appear automatically.
const STATIC_COLUMNS = [
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
      { label: 'Track Order', to: '/track' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Shipping', to: '/shipping' },
      { label: 'Returns', to: '/returns' },
      { label: 'Warranty', to: '/warranty' },
    ],
  },
]

export default function Footer() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let active = true
    const load = () =>
      listCategories().then((cats) => {
        if (active) setCategories(cats)
      })
    load()
    const unsub = subscribe(load) // re-render if an admin edits categories
    return () => {
      active = false
      unsub()
    }
  }, [])

  // Active categories first, then the static Gift Cards link.
  const shopItems = [
    ...categories
      .filter((c) => c.active !== false)
      .map((c) => ({ label: c.label, to: `/shop?category=${c.id}` })),
    { label: 'Gift Cards', to: '/gift-cards' },
  ]
  const columns = [{ h: 'Shop', items: shopItems }, ...STATIC_COLUMNS]

  return (
    <footer id="info" className="mx-auto max-w-[1400px] px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-5xl bg-black p-8 text-[#fff] shadow-soft-lg sm:p-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="font-display text-4xl font-black tracking-tight transition-colors hover:text-flame-500">
              METTEL
            </Link>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#fff]/60">
              Engineered objects for everyday life — coverage, audio, accessories, and more.
              Designed in India. Shipped worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.h}>
                <div className="mb-3 text-flame-500">{col.h}</div>
                <ul className="space-y-2 text-[#fff]/55">
                  {col.items.map((i) => (
                    <li key={i.label}>
                      <Link to={i.to} className="transition-colors hover:text-[#fff]">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#fff]/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#fff]/40">
          <span>© {new Date().getFullYear()} Mettel · mettel.in</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-[#fff]">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-[#fff]">Terms</Link>
            <span className="hidden sm:inline">Made for the everyday object</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
