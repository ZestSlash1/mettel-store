// Vercel Serverless Function — GET /sitemap.xml (rewritten to /api/sitemap)
//
// Generates a sitemap of the static pages + every product detail page, so
// search engines can discover the full catalogue. Reads product ids with the
// service_role key (products are public anyway).
//
// Server env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. SITE_URL optional.

import { createClient } from '@supabase/supabase-js'

const STATIC_PATHS = [
  '/', '/shop', '/about', '/news', '/contact', '/gift-cards',
  '/faq', '/shipping', '/returns', '/warranty', '/privacy', '/terms', '/track',
]

export default async function handler(req, res) {
  const site = (process.env.SITE_URL || 'https://www.mettel.in').replace(/\/$/, '')
  const urls = [...STATIC_PATHS]

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      const { data } = await supabase.from('products').select('id')
      for (const p of data || []) urls.push(`/product/${p.id}`)
    }
  } catch (e) {
    console.warn('[sitemap] product fetch failed:', e?.message)
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(body)
}
