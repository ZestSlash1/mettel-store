import { useState } from 'react'

/**
 * Brand mark for the navbar. Renders the custom logo at /logo.svg if present;
 * if that file is missing (or fails to load), it falls back to the original
 * round "MT" monogram so the nav never breaks.
 *
 * To use your own logo: drop a square-ish file at `public/logo.svg`
 * (or public/logo.png and change LOGO_SRC). It renders at 44px tall.
 */
const LOGO_SRC = '/logo.svg'

export default function Logo() {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[#fff]">
        <span className="font-display text-sm font-black leading-none">MT</span>
      </span>
    )
  }

  return (
    <img
      src={LOGO_SRC}
      alt="Mettel"
      onError={() => setFailed(true)}
      className="h-11 w-auto max-w-[160px] object-contain"
    />
  )
}
