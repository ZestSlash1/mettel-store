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
    solid: 'btn-dark',
    flame: 'btn-flame',
    ghost: 'btn-soft',
    danger: 'bg-transparent text-flame-700 ring-1 ring-flame-700/30 hover:bg-flame-700 hover:text-white',
  }
  return (
    <button
      className={`btn px-4 py-2 text-[11px] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
