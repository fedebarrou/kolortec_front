import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MatrixBackground from './shared/components/MatrixBackground.jsx'
import HeaderSection from './features/landing/components/HeaderSection.jsx'
import WhatsAppFab from './shared/components/WhatsAppFab.jsx'
import { LanguageProvider } from './shared/i18n/LanguageProvider.jsx'

function CanvasScaler() {
  useEffect(() => {
    const canvas = document.querySelector('.kt-zoom-canvas')
    if (!canvas) return undefined

    const update = () => {
      const w = window.innerWidth
      const scale = w >= 1024 ? Math.min(1, w / 1920) : 1
      document.documentElement.style.setProperty('--kt-canvas-scale', String(scale))
      if (scale < 1) {
        const h = canvas.offsetHeight
        canvas.style.marginBottom = `${-(h * (1 - scale))}px`
      } else {
        canvas.style.marginBottom = ''
      }
    }

    update()

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      ro.observe(canvas)
    }

    window.addEventListener('resize', update, { passive: true })

    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', update)
      canvas.style.marginBottom = ''
      document.documentElement.style.removeProperty('--kt-canvas-scale')
    }
  }, [])

  return null
}

createRoot(document.getElementById('root')).render(
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
  </StrictMode>,
)
