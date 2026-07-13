import { useEffect, useState } from 'react'
import { getSiteConfig, DEMO_MODE } from '../services/contentService'
import MaintenancePage from './MaintenancePage'

/**
 * PublishGate — muestra la web normal o la página "en construcción" según web-config.published.
 *
 * - Modo vidriera (VITE_DEMO_DATA=true, build de Vercel para el cliente): SIEMPRE la web full;
 *   el flag `published` (que gobierna el sitio oficial/VPS) se ignora acá.
 * - Build real: consulta el flag. Optimista (arranca mostrando la web para no romper la
 *   hidratación de react-snap ni parpadear en el caso común "publicado"); si el flag vuelve
 *   false, cambia a mantenimiento. Fail-open: si la API falla, se queda publicado.
 * - Vista previa: si la web está despublicada PERO el link trae el token correcto
 *   (?preview=<token> → preview_authorized), se muestra el sitio real + una cinta "Vista previa".
 */
function PreviewRibbon() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        background: '#f4df33',
        color: '#111',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '.02em',
        padding: '5px 10px',
        boxShadow: '0 1px 6px rgba(0,0,0,.35)',
      }}
    >
      Vista previa — esta web no está publicada (nadie más la ve)
    </div>
  )
}

function PublishGate({ children }) {
  const [maintenance, setMaintenance] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) return
    let mounted = true
    getSiteConfig()
      .then((cfg) => {
        if (!mounted || !cfg) return
        if (cfg.published === false) {
          if (cfg.previewAuthorized === true) setPreview(true)
          else setMaintenance(true)
        }
      })
      .catch(() => {
        /* fail-open: dejar la web visible ante error de red */
      })
    return () => {
      mounted = false
    }
  }, [])

  if (maintenance) return <MaintenancePage />
  return preview ? (
    <>
      <PreviewRibbon />
      {children}
    </>
  ) : (
    children
  )
}

export default PublishGate
