import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProductDetail from './pages/ProductDetail'
import AuthGate from './admin/AuthGate'

// Admin is code-split: shoppers never download it.
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

function Storefront() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ProductGrid />
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
    <div className="min-h-screen bg-silver text-ink">
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/product/:id" element={<ProductDetail />} />
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
      </Routes>

      {/* Cart drawer lives at app level so it's reachable from every route */}
      <CartDrawer />
    </div>
  )
}
