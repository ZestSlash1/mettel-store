/**
 * Supabase Storage serves images at `/object/public/...`. Swapping that
 * segment for `/render/image/public/...` and adding query params hits
 * Supabase's on-the-fly image transform endpoint (resize + recompress;
 * it also auto-negotiates WebP via the request's Accept header — no
 * format param needed). Transforms require the project's image
 * transformation add-on; if it isn't enabled the render endpoint 404s,
 * so every caller must be prepared to fall back to the original URL.
 */
const STORAGE_MARKER = '/storage/v1/object/public/'
const RENDER_MARKER = '/storage/v1/render/image/public/'

export function isSupabaseStorageUrl(url) {
  return typeof url === 'string' && url.includes(STORAGE_MARKER)
}

export function supabaseRenderUrl(url, { width, quality = 70, resize = 'contain' } = {}) {
  if (!isSupabaseStorageUrl(url)) return url
  const base = url.replace(STORAGE_MARKER, RENDER_MARKER)
  const params = new URLSearchParams()
  if (width) params.set('width', String(Math.round(width)))
  params.set('quality', String(quality))
  params.set('resize', resize)
  return `${base}?${params.toString()}`
}

/** width/srcset pairs for a Supabase-stored image; null when not transformable. */
export function buildSrcSet(url, widths) {
  if (!isSupabaseStorageUrl(url)) return null
  return widths.map((w) => `${supabaseRenderUrl(url, { width: w })} ${w}w`).join(', ')
}

/** Tiny, heavily-compressed version used as a blur-up placeholder. */
export function lqipUrl(url) {
  if (!isSupabaseStorageUrl(url)) return null
  return supabaseRenderUrl(url, { width: 24, quality: 20 })
}
