import Navigation from './Navigation'
import Footer from './Footer'
import Seo from './Seo'
import { useScrollReveal } from '../lib/useReveal'

/**
 * Standard layout for content pages: floating nav, a big brutalist page header,
 * the page body, then the footer. Scroll reset on navigation is handled globally
 * by <ScrollManager>. Pass seoTitle/seoDescription to set the tab + share tags.
 *
 * Header (eyebrow/title/intro) and the body wrapper each scroll-reveal once on
 * mount/scroll-into-view. Pages can mark their own top-level blocks with
 * `data-reveal` to stagger those specifically instead of the body revealing as
 * one chunk — see useScrollReveal for how the target selection works.
 */
export default function PageShell({ eyebrow, title, intro, seoTitle, seoDescription, children }) {
  const headerRef = useScrollReveal()
  const bodyRef = useScrollReveal({ y: 20 })

  return (
    <>
      <Seo title={seoTitle} description={seoDescription} />
      <Navigation />
      <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        {eyebrow || title || intro ? (
          <header ref={headerRef} className="mb-12">
            {eyebrow ? <div data-reveal className="eyebrow mb-3">{eyebrow}</div> : null}
            {title ? (
              <h1 data-reveal className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight sm:text-7xl">
                {title}
              </h1>
            ) : null}
            {intro ? (
              <p data-reveal className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-ink/60">{intro}</p>
            ) : null}
            <div className="rule mt-8" />
          </header>
        ) : null}
        <div ref={bodyRef}>{children}</div>
      </main>
      <Footer />
    </>
  )
}

/**
 * One policy section, revealed individually as the reader scrolls to it —
 * these pages run long, so a single page-level reveal would only ever be
 * visible for the first screenful.
 */
function Section({ h, body }) {
  const ref = useScrollReveal({ y: 18 })
  return (
    <section ref={ref}>
      <h2 className="font-display text-2xl font-black uppercase tracking-tight">{h}</h2>
      <div className="mt-3 space-y-3 font-mono text-[12px] leading-relaxed text-ink/65">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
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
          <Section key={s.h} h={s.h} body={s.body} />
        ))}
      </div>
    </PageShell>
  )
}
