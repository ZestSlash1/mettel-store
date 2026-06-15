import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import Subscribe from './components/Subscribe'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Seo from './components/Seo'
import ScrollManager from './components/ScrollManager'
import ErrorBoundary from './components/ErrorBoundary'
import ProductDetail from './pages/ProductDetail'
import Shop from './pages/Shop'
import About from './pages/About'
import News from './pages/News'
import Contact from './pages/Contact'
import GiftCards from './pages/GiftCards'
import { Shipping, Returns, Warranty } from './pages/Policies'
import { Privacy, Terms } from './pages/Legal'
import FAQ from './pages/FAQ'
import NotFound from './pages/NotFound'
import AuthGate from './admin/AuthGate'

// Admin is code-split: shoppers never download it.
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

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-silver font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">
      Loading control panel…
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-silver text-ink">
        <ScrollManager />
        <Routes>
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

        {/* Cart drawer lives at app level so it's reachable from every route */}
        <CartDrawer />
      </div>
    </ErrorBoundary>
  )
}
