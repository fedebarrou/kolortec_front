import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MatrixBackground from './shared/components/MatrixBackground.jsx'
import HeaderSection from './features/landing/components/HeaderSection.jsx'
import WhatsAppFab from './shared/components/WhatsAppFab.jsx'
import LoginNudge from './shared/components/LoginNudge.jsx'
import { LanguageProvider } from './shared/i18n/LanguageProvider.jsx'
import { AuthProvider } from './shared/auth/AuthContext.jsx'
import PublishGate from './shared/components/PublishGate.jsx'

/**
 * El lienzo YA NO ESCALA (sep-2026), así que acá no queda nada que mantener.
 *
 * Existía un CanvasScaler que publicaba `--kt-canvas-scale` en cada resize, y el
 * script inline de index.html lo calculaba antes del primer paint para que el
 * documento no se encogiera de un frame al otro. Con el zoom fuera, la escala es
 * 1 siempre: todos los que la leen —el hero, el scrolltelling, useFullBleed y la
 * zona segura del flotante— la piden como `var(--kt-canvas-scale, 1)`, así que
 * al no publicarla caen en el respaldo, que ahora es el valor correcto.
 *
 * Se borra en vez de dejarla clavada en 1 para que nadie la vuelva a usar
 * pensando que sigue significando algo.
 */

const rootEl = document.getElementById('root')

const tree = (
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <PublishGate>
            <div className="kt-app-shell">
              <MatrixBackground />
              <HeaderSection />
              <div className="kt-zoom-canvas">
                <App />
              </div>
              <WhatsAppFab />
              <LoginNudge />
            </div>
          </PublishGate>
        </AuthProvider>
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
