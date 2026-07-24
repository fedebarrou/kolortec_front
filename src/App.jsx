import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LandingChrome from './features/landing/components/LandingChrome'
import { usePageTracking } from './shared/services/tracking'

const HomePage = lazy(() => import('./features/home/pages/HomePage'))
const ShopPage = lazy(() => import('./features/catalog/pages/ShopPage'))
const CategoryPage = lazy(() => import('./features/catalog/pages/CategoryPage'))
const ProductDetailPage = lazy(() => import('./features/product/pages/ProductDetailPage'))
const ServicesPage = lazy(() => import('./features/services/pages/ServicesPage'))
const SupportPage = lazy(() => import('./features/support/pages/SupportPage'))
const GarantiasPage = lazy(() => import('./features/warranty/pages/GarantiasPage'))
const ContactPage = lazy(() => import('./features/contact/pages/ContactPage'))
const DistributorsPage = lazy(() => import('./features/distributors/pages/DistributorsPage'))
const RentalsPage = lazy(() => import('./features/rentals/pages/RentalsPage'))
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const GuidesIndexPage = lazy(() => import('./features/guides/pages/GuidesIndexPage'))
const GuideDetailPage = lazy(() => import('./features/guides/pages/GuideDetailPage'))
const DownloadRedirect = lazy(() => import('./features/landing/components/DownloadRedirect'))

function App() {
  usePageTracking()

  return (
    <Routes>
      <Route element={<LandingChrome />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:categorySlug" element={<CategoryPage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/soporte" element={<SupportPage />} />
        <Route path="/soporte/guias" element={<GuidesIndexPage />} />
        <Route path="/soporte/guias/:slug" element={<GuideDetailPage />} />
        <Route path="/garantias" element={<GarantiasPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/distribuidores" element={<DistributorsPage />} />
        <Route path="/rentals" element={<RentalsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
      {/* Landing de descarga (abre el QR del producto) — clean full-screen, sin chrome */}
      <Route
        path="/d/:id"
        element={
          <Suspense fallback={<div className="min-h-screen bg-deep-black" />}>
            <DownloadRedirect />
          </Suspense>
        }
      />
      <Route path="/editable" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
