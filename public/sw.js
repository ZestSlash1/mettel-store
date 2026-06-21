// Minimal service worker: caches the static build (JS/CSS/fonts/images) and
// the HTML shell so the site has basic offline support. Deliberately never
// touches Supabase, Razorpay, or anything under /api/ — cart/checkout state
// and live data must always go to the network, never the cache.
const CACHE_NAME = 'mettel-static-v1'
const STATIC_RE = /\.(?:js|css|png|jpg|jpeg|svg|webp|avif|woff2?|ico)$/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never intercept Supabase/Razorpay/etc.
  if (url.pathname.startsWith('/api/')) return // cart/checkout/order endpoints stay network-only

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      }),
    )
  }
})
