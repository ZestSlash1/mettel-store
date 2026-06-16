import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BUSINESS } from '../config/business'

const LS_KEY = 'mettel:announcement:dismissed'

export default function AnnouncementBar() {
  const cfg = BUSINESS.announcement
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === cfg?.text } catch { return false }
  })

  if (!cfg?.active || !cfg?.text || hidden) return null

  const dismiss = (e) => {
    e.stopPropagation()
    try { localStorage.setItem(LS_KEY, cfg.text) } catch {}
    setHidden(true)
  }

  const inner = (
    <span className="flex-1 text-center font-mono text-[11px] uppercase tracking-[0.14em]">
      {cfg.text}
    </span>
  )

  return (
    <div className="relative z-50 flex items-center bg-ink px-4 py-2 text-white">
      {cfg.link ? (
        cfg.link.startsWith('/') ? (
          <Link to={cfg.link} className="flex flex-1 hover:text-flame-400 transition-colors">{inner}</Link>
        ) : (
          <a href={cfg.link} target="_blank" rel="noopener noreferrer" className="flex flex-1 hover:text-flame-400 transition-colors">{inner}</a>
        )
      ) : inner}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>
    </div>
  )
}
