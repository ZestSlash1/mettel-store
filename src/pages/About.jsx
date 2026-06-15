import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function About() {
  return (
    <PageShell
      eyebrow="Company / About"
      title={<>Built<br />to last</>}
      intro="MetTel makes engineered coverage for the device you carry everywhere — high-end phone covers and accessories, designed in India and shipped worldwide."
    >
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-4 font-mono text-[12px] leading-relaxed text-ink/65 lg:col-span-2">
          <p>
            We started MetTel with one frustration: protective cases that treat your phone like a
            billboard. Loud prints, soft plastic, landfill in twelve months. We wanted the opposite —
            a single, honest object that does its job and gets out of the way.
          </p>
          <p>
            Every case is a single-piece monocoque in woven aramid fiber, 0.95&nbsp;mm thick, with shock
            channels routed into the corners and machined button cutouts. No printed graphics. No bulk.
            Built to outlive the device it protects, not the trend cycle.
          </p>
          <p>
            We design in-house, prototype relentlessly, and ship direct so the price reflects the
            product — not a retail markup. That’s the whole company.
          </p>
        </div>

        <aside className="space-y-6 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          {[
            ['Founded', '2024 · India'],
            ['Material', '600D woven aramid'],
            ['Standard', 'MIL-STD 3 m drop'],
            ['Shipping', 'Worldwide, tracked'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-dashed border-ink/15 pb-2 font-mono text-[11px] uppercase tracking-wider last:border-0">
              <span className="text-ink/40">{k}</span>
              <span className="text-ink/80">{v}</span>
            </div>
          ))}
          <Link
            to="/shop"
            className="block rounded-full bg-ink py-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-500"
          >
            Shop the lineup →
          </Link>
        </aside>
      </div>
    </PageShell>
  )
}
