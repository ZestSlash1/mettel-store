import PageShell from '../components/PageShell'

const POSTS = [
  {
    date: '2026-05-28',
    tag: 'Range',
    title: 'The range is expanding',
    body: 'MetTel is growing beyond coverage — audio, accessories, and lifestyle goods are joining the lineup, held to the same standard.',
  },
  {
    date: '2026-04-15',
    tag: 'Company',
    title: 'Now shipping worldwide',
    body: 'Tracked international delivery is live. The full catalogue now reaches doorsteps outside India in 7–14 days.',
  },
  {
    date: '2026-03-02',
    tag: 'Design',
    title: 'The case for no noise',
    body: 'Why every MetTel object ships understated — the thinking behind honest products with zero printed branding.',
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
      seoTitle="News"
      seoDescription="Product drops, restocks, and notes from the MetTel workshop."
      title={<>News</>}
      intro="Product drops, restocks, and notes from the workshop."
    >
      <div className="space-y-4">
        {POSTS.map((p) => (
          <article
            key={p.title}
            className="card-soft flex flex-col gap-3 p-6 sm:flex-row sm:items-baseline sm:justify-between"
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
