import { useState } from 'react'
import { buildSrcSet, lqipUrl, isSupabaseStorageUrl, supabaseRenderUrl } from '../lib/image'

const DEFAULT_WIDTHS = [240, 360, 480, 720, 960]

/**
 * Drop-in replacement for `<img>` on product photography. Adds a
 * Supabase-transformed srcset + LQIP blur-up when the source is a
 * Supabase Storage URL; degrades to a plain `<img>` for anything else
 * (seed data, external URLs) so it's always safe to use.
 */
export default function ResponsiveImage({
  src,
  alt,
  className = '',
  sizes = '(min-width: 1024px) 30vw, 50vw',
  widths = DEFAULT_WIDTHS,
  loading = 'lazy',
  fetchPriority,
}) {
  const transformable = isSupabaseStorageUrl(src)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const placeholder = transformable ? lqipUrl(src) : null

  const finalSrc = transformable && !failed ? supabaseRenderUrl(src, { width: widths[widths.length - 1] }) : src
  const srcSet = transformable && !failed ? buildSrcSet(src, widths) : undefined

  return (
    <span className={`relative block h-full w-full ${className}`}>
      {placeholder && !loaded && !failed ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-105 object-contain blur-md"
        />
      ) : null}
      <img
        src={finalSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={loading}
        fetchpriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`relative h-full w-full object-contain transition-opacity duration-500 ${loaded || failed ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
