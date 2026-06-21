import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function NotFound() {
  return (
    <PageShell seoTitle="Page not found">
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="font-pixel text-7xl text-flame-500">404</div>
        <h1 className="mt-4 font-display text-5xl font-black uppercase tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-sm font-mono text-[12px] text-ink/50">
          That page doesn’t exist or was moved. Let’s get you back to the good stuff.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
            Back to store
          </Link>
          <Link to="/shop" className="btn rounded-full bg-silver-200 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-white">
            Browse the lineup
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
