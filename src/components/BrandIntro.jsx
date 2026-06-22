/**
 * Plain-text explainer of what Mettel sells. Exists mainly so the homepage
 * has at least one crawlable sentence describing the product (Google's
 * OAuth consent screen review flags homepages that don't explain the app's
 * purpose) — but it also just reads fine as on-brand copy.
 */
export default function BrandIntro() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="card-soft p-8 sm:p-12">
        <div className="eyebrow mb-3">About</div>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.9] tracking-tight sm:text-4xl">
          Engineered Everyday Objects
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-[12px] leading-relaxed text-ink/60">
          Mettel designs and manufactures premium iPhone cases in India. Built for iPhone 15 through
          iPhone 17 Pro Max.
        </p>
      </div>
    </section>
  )
}
