import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, DUR, usePrefersReducedMotion } from './lib/motion'
import Preloader from './components/Preloader'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import Subscribe from './components/Subscribe'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import CustomCursor from './components/CustomCursor'
import EasterEgg from './components/EasterEgg'
import Seo from './components/Seo'
import ScrollManager from './components/ScrollManager'
import ErrorBoundary from './components/ErrorBoundary'
import AuthGate from './admin/AuthGate'
import { BUSINESS } from './config/business'
import CookieBanner from './components/CookieBanner'
import AnnouncementBar from './components/AnnouncementBar'
import SmoothScroll from './lib/smoothScroll'

// Code-split every page that isn't the storefront home.
// Shoppers who only visit "/" never download product-detail, admin, etc.
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Shop         = lazy(() => import('./pages/Shop'))
const About        = lazy(() => import('./pages/About'))
const News         = lazy(() => import('./pages/News'))
const Contact      = lazy(() => import('./pages/Contact'))
const GiftCards    = lazy(() => import('./pages/GiftCards'))
const Track        = lazy(() => import('./pages/Track'))
const Account      = lazy(() => import('./pages/Account'))
const NotFound     = lazy(() => import('./pages/NotFound'))
const FAQ          = lazy(() => import('./pages/FAQ'))
const AuthPage      = lazy(() => import('./pages/AuthPage'))

const Shipping  = lazy(() => import('./pages/Policies').then((m) => ({ default: m.Shipping })))
const Returns   = lazy(() => import('./pages/Policies').then((m) => ({ default: m.Returns })))
const Warranty  = lazy(() => import('./pages/Policies').then((m) => ({ default: m.Warranty })))
const Privacy   = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })))
const Terms     = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })))

// Admin is always code-split.
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

function Storefront() {
  return (
    <>
      <Seo />
      <Navigation />
      <main>
        <Hero />
        <ProductGrid />
        <Subscribe />
      </main>
      <Footer />
    </>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-pulse rounded-full bg-silver-200" />
    </div>
  )
}

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-silver font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">
      Loading control panel…
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()

  return (
    <ErrorBoundary>
      <Preloader />
      <SmoothScroll>
      <div className="min-h-screen bg-silver text-ink">
        <AnnouncementBar />
        <ScrollManager />
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -10 }}
              transition={{ duration: DUR.base, ease: EASE.out }}
            >
              <Routes location={location}>
                <Route path="/" element={<Storefront />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about" element={<About />} />
                <Route path="/news" element={<News />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gift-cards" element={<GiftCards />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/warranty" element={<Warranty />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/track" element={<Track />} />
                <Route path="/account" element={<Account />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/admin/*"
                  element={
                    <AuthGate>
                      <Suspense fallback={<AdminFallback />}>
                        <AdminDashboard />
                      </Suspense>
                    </AuthGate>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>

        <CustomCursor />
        <EasterEgg />

        {/* Cart drawer lives at app level so it's reachable from every route */}
        <CartDrawer />
        <CookieBanner />

        {/* WhatsApp floating button — only shown when a number is configured */}
        {BUSINESS.whatsapp ? (
          <a
            href={`https://wa.me/${BUSINESS.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 32 32" fill="white" width="28" height="28" aria-hidden="true">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.425.638 4.7 1.752 6.672L2 30l7.528-1.972A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.558 11.558 0 0 1-5.89-1.61l-.42-.25-4.465 1.17 1.19-4.34-.275-.445A11.534 11.534 0 0 1 4.4 16C4.4 9.594 9.594 4.4 16 4.4S27.6 9.594 27.6 16 22.406 27.6 16 27.6zm6.33-8.635c-.347-.173-2.055-1.013-2.374-1.13-.318-.115-.55-.173-.78.173-.23.347-.893 1.13-1.095 1.36-.202.23-.403.26-.75.087-.347-.174-1.464-.54-2.788-1.72-1.03-.918-1.724-2.051-1.927-2.398-.202-.347-.022-.535.152-.707.156-.155.347-.404.52-.606.173-.202.23-.347.347-.578.115-.23.058-.433-.029-.606-.086-.173-.78-1.882-1.07-2.579-.28-.678-.567-.585-.78-.596l-.663-.011c-.23 0-.606.086-.923.433-.317.347-1.213 1.185-1.213 2.89s1.242 3.352 1.415 3.582c.173.23 2.445 3.732 5.924 5.234.828.358 1.474.571 1.977.731.83.264 1.587.227 2.184.138.666-.1 2.055-.84 2.344-1.65.29-.81.29-1.505.202-1.65-.086-.144-.317-.23-.663-.404z" />
            </svg>
          </a>
        ) : null}
      </div>
      </SmoothScroll>
    </ErrorBoundary>
  )
}
