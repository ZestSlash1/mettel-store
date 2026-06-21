const LS_KEY = 'mettel:theme'

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** Applies the theme class, animating the transition unless the browser is told not to. */
export function applyTheme(theme, { animate = true } = {}) {
  const root = document.documentElement
  if (animate && typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === false) {
    root.classList.add('theme-animating')
    window.setTimeout(() => root.classList.remove('theme-animating'), 400)
  }
  root.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(LS_KEY, theme)
  } catch {
    /* ignore */
  }
}
