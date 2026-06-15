import Navigation from './Navigation'
import Footer from './Footer'
import Seo from './Seo'

/**
 * Standard layout for content pages: floating nav, a big brutalist page header,
 * the page body, then the footer. Scroll reset on navigation is handled globally
 * by <ScrollManager>. Pass seoTitle/seoDescription to set the tab + share tags.
 */
export default function PageShell({ eyebrow, title, intro, seoTitle, seoDescription, children }) {
  return (
    <>
      <Seo title={seoTitle} description={seoDescription} />
      <Navigation />
      <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        {eyebrow || title || intro ? (
          <header className="mb-12">
            {eyebrow ? <div className="eyebrow mb-3">{eyebrow}</div> : null}
            {title ? (
              <h1 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight sm:text-7xl">
                {title}
              </h1>
            ) : null}
            {intro ? (
              <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-ink/60">{intro}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </main>
      <Footer />
    </>
  )
}

/**
 * Shared template for text-heavy policy pages (shipping, returns, warranty).
 * `sections` is [{ h, body: string[] }].
 */
export function PolicyPage({ eyebrow, title, intro, seoTitle, seoDescription, sections }) {
  return (
    <PageShell eyebrow={eyebrow} title={title} intro={intro} seoTitle={seoTitle} seoDescription={seoDescription}>
      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight">{s.h}</h2>
            <div className="mt-3 space-y-3 font-mono text-[12px] leading-relaxed text-ink/65">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  )
}
