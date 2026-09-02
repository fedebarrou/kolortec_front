import { StrictMode, useEffect } from 'react'
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
 * CanvasScaler — mantiene --kt-canvas-scale al dia en cada resize.
 *
 * El valor INICIAL ya no sale de aca: lo calcula el script inline de index.html,
 * antes del primer paint. Cuando vivia solo en este efecto, el primer paint usaba
 * zoom:1 y el efecto lo bajaba a ~0.71 un frame despues — el documento entero se
 * encogia ~30%%, y sobre esa altura provisoria el navegador restauraba el scroll.
 * El update() del montaje quedo igual (escribe el mismo valor) para que el efecto
 * siga siendo la unica fuente durante la vida de la app.
 */
function CanvasScaler() {
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      // Sin tope. Antes era `Math.min(1, w / 1920)`, así que arriba de 1920 la
      // escala se clavaba en 1: el lienzo se quedaba en 1920px y se centraba,
      // dejando bandas negras a los costados — 320px de cada lado en un monitor
      // de 2560. Ahora el lienzo llena la pantalla también cuando sobra ancho.
      //
      // Debajo de 1920 NO cambia nada: el mínimo seguía siendo el mismo valor.
      // (El texto chico queda igual de chico entre 1024 y 1600; eso es el
      // problema de fondo del lienzo y se resuelve aparte, no acá.)
      //
      // Debajo de 1024 sigue en 1: ahí no hay lienzo, manda el responsive real.
      const scale = w >= 1024 ? w / 1920 : 1
      document.documentElement.style.setProperty('--kt-canvas-scale', String(scale))
      // --hero-viewport-scale: el MISMO valor, con el nombre que espera el
      // renderer del hero (scroll-contract.js). El renderer es compartido con
      // el admin y con tiendita-store, así que no puede conocer una variable
      // que se llama "kt-": lee la genérica, que sin declarar vale 1.
      // Sin esto el escenario del scrolltelling se dibuja al `scale` por ciento
      // del alto real y el JS calcula los umbrales sobre otro alto.
      document.documentElement.style.setProperty('--hero-viewport-scale', String(scale))
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
              <CanvasScaler />
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
