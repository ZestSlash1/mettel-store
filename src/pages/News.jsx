import PageShell from '../components/PageShell'

const POSTS = [
  {
    date: '2026-05-28',
    tag: 'Product',
    title: 'Aramid Shell 01 restocked',
    body: 'Our flagship woven-aramid case is back in stock across all supported devices after a three-week production run.',
  },
  {
    date: '2026-04-15',
    tag: 'Company',
    title: 'Now shipping worldwide',
    body: 'Tracked international delivery is live. Same engineered coverage, now reaching doorsteps outside India in 7–14 days.',
  },
  {
    date: '2026-03-02',
    tag: 'Design',
    title: 'The case for no graphics',
    body: 'Why every MetTel shell ships bare — the thinking behind a single, honest object with zero printed branding.',
  },
]

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

export default function News() {
  return (
    <PageShell
      eyebrow="Company / News"
      title={<>News</>}
      intro="Product drops, restocks, and notes from the workshop."
    >
      <div className="space-y-4">
        {POSTS.map((p) => (
          <article
            key={p.title}
            className="flex flex-col gap-3 rounded-3xl bg-white p-6 ring-1 ring-ink/5 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
                <span className="rounded-full bg-flame-100 px-2.5 py-1 text-flame-700">{p.tag}</span>
                <span>{formatDate(p.date)}</span>
              </div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">{p.title}</h2>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink/60">{p.body}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}
