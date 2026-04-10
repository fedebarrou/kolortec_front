import { Navigate, Route, Routes } from 'react-router-dom'
import LandingChrome from './features/landing/components/LandingChrome'
import ContactPage from './features/contact/pages/ContactPage'
import HomePage from './features/home/pages/HomePage'
import LoginPage from './features/auth/pages/LoginPage'
import ProductDetailPage from './features/product/pages/ProductDetailPage'
import ServicesPage from './features/services/pages/ServicesPage'
import ShopPage from './features/catalog/pages/ShopPage'

function App() {
  return (
    <Routes>
      <Route element={<LandingChrome />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tienda" element={<ShopPage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/editable" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
