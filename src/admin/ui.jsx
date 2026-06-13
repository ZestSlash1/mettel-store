/* Small, on-brand form primitives shared across the admin panel. */

export const inputClass =
  'w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-flame-500 focus:ring-2 focus:ring-flame-500/20'

export const labelClass =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45'

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block font-mono text-[10px] text-ink/35">{hint}</span> : null}
    </label>
  )
}

export function Btn({ children, variant = 'solid', className = '', ...props }) {
  const variants = {
    solid: 'bg-ink text-white hover:bg-flame-500',
    flame: 'bg-flame-500 text-white hover:bg-flame-600',
    ghost: 'bg-transparent text-ink ring-1 ring-ink/15 hover:bg-ink/[0.05]',
    danger: 'bg-transparent text-flame-700 ring-1 ring-flame-700/30 hover:bg-flame-700 hover:text-white',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
