import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function About() {
  return (
    <PageShell
      eyebrow="Company / About"
      seoTitle="About"
      seoDescription="Mettel makes designed objects for everyday life — coverage, audio, accessories, and lifestyle goods, built in India and shipped worldwide."
      title={<>Built<br />to last</>}
      intro="Mettel makes engineered objects for everyday life — phone coverage, audio, accessories, and lifestyle goods, designed in India and shipped worldwide."
    >
      <div className="grid gap-12 lg:grid-cols-3">
        <div data-reveal className="space-y-4 font-mono text-[12px] leading-relaxed text-ink/65 lg:col-span-2">
          <p>
            We started Mettel with one frustration: everyday products designed like billboards —
            loud branding, cheap materials, landfill in twelve months. We wanted the opposite — honest
            objects that do their job and get out of the way.
          </p>
          <p>
            That standard now spans categories: phone coverage, audio, accessories, and lifestyle
            goods. Whatever the product, the rule is the same — considered design, materials chosen
            to last, and zero filler. Built to outlive the trend cycle, not chase it.
          </p>
          <p>
            We curate and design with the same eye across every category, and ship direct so the
            price reflects the product — not a retail markup. That’s the whole company.
          </p>
        </div>

        <aside data-reveal className="card-soft space-y-6 p-6">
          {[
            ['Founded', '2024 · India'],
            ['Range', 'Coverage · Audio · More'],
            ['Standard', 'Built to last'],
            ['Shipping', 'Worldwide, tracked'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-ink/[0.06] pb-2 font-mono text-[11px] uppercase tracking-wider last:border-0">
              <span className="text-ink/40">{k}</span>
              <span className="text-ink/80">{v}</span>
            </div>
          ))}
          <Link
            to="/shop"
            className="btn btn-dark w-full py-3 text-[11px] tracking-[0.18em]"
          >
            Shop the lineup →
          </Link>
        </aside>
      </div>
    </PageShell>
  )
}
