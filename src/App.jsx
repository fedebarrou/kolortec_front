import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LandingChrome from './features/landing/components/LandingChrome'
import { usePageTracking } from './shared/services/tracking'

const HomePage = lazy(() => import('./features/home/pages/HomePage'))
const ShopPage = lazy(() => import('./features/catalog/pages/ShopPage'))
const CategoryPage = lazy(() => import('./features/catalog/pages/CategoryPage'))
const LinePage = lazy(() => import('./features/catalog/pages/LinePage'))
const ProductDetailPage = lazy(() => import('./features/product/pages/ProductDetailPage'))
const ServicesPage = lazy(() => import('./features/services/pages/ServicesPage'))
const SupportPage = lazy(() => import('./features/support/pages/SupportPage'))
const GarantiasPage = lazy(() => import('./features/warranty/pages/GarantiasPage'))
const ContactPage = lazy(() => import('./features/contact/pages/ContactPage'))
const JoinPage = lazy(() => import('./features/join/pages/JoinPage'))
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
        {/* Linea de producto: existe para que los accesos del hero y del
            scrolltelling (href de texto libre) tengan a donde apuntar. */}
        <Route path="/linea/:lineSlug" element={<LinePage />} />
        <Route path="/lineas/:lineSlug" element={<LinePage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/soporte" element={<SupportPage />} />
        <Route path="/soporte/guias" element={<GuidesIndexPage />} />
        <Route path="/soporte/guias/:slug" element={<GuideDetailPage />} />
        <Route path="/garantias" element={<GarantiasPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/sumate" element={<JoinPage />} />
        {/* Las dos rutas viejas siguen funcionando: eran dos formularios casi
            idénticos y ahora el tipo se elige dentro de /sumate. Redirigen en
            vez de romper links que ya existan afuera. */}
        <Route path="/distribuidores" element={<Navigate to="/sumate" replace />} />
        <Route path="/rentals" element={<Navigate to="/sumate" replace />} />
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
