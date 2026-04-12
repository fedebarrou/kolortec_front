import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MatrixBackground from './shared/components/MatrixBackground.jsx'
import { LanguageProvider } from './shared/i18n/LanguageProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <div className="kt-app-shell">
          <MatrixBackground />
          <App />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
