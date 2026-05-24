import { StrictMode, useEffect } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MatrixBackground from './shared/components/MatrixBackground.jsx'
import HeaderSection from './features/landing/components/HeaderSection.jsx'
import WhatsAppFab from './shared/components/WhatsAppFab.jsx'
import { LanguageProvider } from './shared/i18n/LanguageProvider.jsx'

function CanvasScaler() {
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const scale = w >= 1024 ? Math.min(1, w / 1920) : 1
      document.documentElement.style.setProperty('--kt-canvas-scale', String(scale))
    }

    update()
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('resize', update)
      document.documentElement.style.removeProperty('--kt-canvas-scale')
    }
  }, [])

  return null
}

const rootEl = document.getElementById('root')

const tree = (
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <div className="kt-app-shell">
          <MatrixBackground />
          <HeaderSection />
          <div className="kt-zoom-canvas">
            <App />
          </div>
          <WhatsAppFab />
          <CanvasScaler />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>
)

// react-snap deja contenido pre-renderizado en #root — hidratamos.
// Dev y prod sin snapshot arrancan vacíos → createRoot.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree)
} else {
  createRoot(rootEl).render(tree)
}
