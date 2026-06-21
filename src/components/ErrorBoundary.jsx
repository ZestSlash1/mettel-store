import { Component } from 'react'

/**
 * App-level error boundary. If a render throws, shoppers see an on-brand
 * recovery screen instead of a blank white page, and the error is logged.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-silver px-6 text-center text-ink">
          <div className="font-pixel text-6xl text-flame-500">:(</div>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight">Something broke</h1>
          <p className="mt-3 max-w-sm font-mono text-[12px] text-ink/50">
            An unexpected error hit this page. Reloading usually clears it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-flame-500 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-flame-600"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-full bg-silver-200 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-black hover:text-[#fff]"
            >
              Back to store
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
