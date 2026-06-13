export default function Footer() {
  return (
    <footer id="info" className="mx-auto max-w-[1400px] px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-3xl bg-ink p-8 text-silver sm:p-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="font-display text-4xl font-black tracking-tight">METTEL</div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/60">
              Engineered coverage for the device you carry everywhere. Built in India. Shipped
              worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-3">
            {[
              { h: 'Shop', items: ['Phone Covers', 'Accessories', 'Gift Cards'] },
              { h: 'Company', items: ['About', 'News', 'Contact'] },
              { h: 'Support', items: ['Shipping', 'Returns', 'Warranty'] },
            ].map((col) => (
              <div key={col.h}>
                <div className="mb-3 text-flame-500">{col.h}</div>
                <ul className="space-y-2 text-silver/55">
                  {col.items.map((i) => (
                    <li key={i}>
                      <a href="#" className="transition-colors hover:text-white">
                        {i}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-silver/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
          <span>© {new Date().getFullYear()} MetTel · mettel.in</span>
          <span>Made for the everyday object</span>
        </div>
      </div>
    </footer>
  )
}
