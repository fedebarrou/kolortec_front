import { Navigate, Route, Routes } from 'react-router-dom'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PixelPerfectLandingPage from './pages/PixelPerfectLandingPage'
import ServicesPage from './pages/ServicesPage'
import ShopPage from './pages/ShopPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PixelPerfectLandingPage />} />
      <Route path="/editable" element={<HomePage />} />
      <Route path="/tienda" element={<ShopPage />} />
      <Route path="/servicios" element={<ServicesPage />} />
      <Route path="/contacto" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
