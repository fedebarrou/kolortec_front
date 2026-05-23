import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LandingChrome from './features/landing/components/LandingChrome'

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

function App() {
  return (
    <Routes>
      <Route element={<LandingChrome />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:categorySlug" element={<CategoryPage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/soporte" element={<SupportPage />} />
        <Route path="/garantias" element={<GarantiasPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/distribuidores" element={<DistributorsPage />} />
        <Route path="/rentals" element={<RentalsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/editable" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
