import { useEffect, useLayoutEffect, useState } from 'react'
import { getSiteConfig, DEMO_MODE } from '../services/contentService'
import MaintenancePage from './MaintenancePage'

/**
 * PublishGate — muestra la web normal o la página "en construcción" según web-config.published.
 *
 * - Modo vidriera (VITE_DEMO_DATA=true, build de Vercel para el cliente): SIEMPRE la web full;
 *   el flag `published` (que gobierna el sitio oficial/VPS) se ignora acá.
 * - Build real: consulta el flag. Para no PARPADEAR el sitio pre-renderizado antes de taparlo,
 *   cacheamos el último `published` conocido en localStorage (`kt:pub`): si la última carga lo vio
 *   despublicado, el PRIMER render ya es "en construcción" (y el script anti-flash de index.html
 *   mantiene #root oculto hasta que React decide). Luego la API confirma/corrige y actualiza la
 *   cache. Fail-open SOLO en primera visita sin cache: si la API falla se muestra la web.
 * - Vista previa: si la web está despublicada PERO el link trae el token correcto
 *   (?preview=<token> → preview_authorized), se muestra el sitio real + una cinta "Vista previa".
 */
const PUB_CACHE_KEY = 'kt:pub'

// ¿El link trae token de vista previa? (mismo criterio que getSiteConfig → no tapar en preview)
function hasPreviewToken() {
  try {
    if (typeof window === 'undefined') return false
    const fromUrl = new URL(window.location.href).searchParams.get('preview')
    return !!(fromUrl || window.sessionStorage.getItem('kt:preview'))
  } catch {
    return false
  }
}

// Último `published` conocido: '0' = la última vez estaba despublicado.
function cachedUnpublished() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(PUB_CACHE_KEY) === '0'
  } catch {
    return false
  }
}

// Revela #root (lo oculta el script anti-flash de index.html cuando la cache dice despublicado).
function revealRoot() {
  try {
    document.documentElement.removeAttribute('data-kt-hold')
  } catch {
    /* noop */
  }
}
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
  // Primer render: si la última carga vio la web despublicada (y no es preview/demo), ya
  // arrancamos en "en construcción" → nada de flash del sitio real.
  const [maintenance, setMaintenance] = useState(
    () => !DEMO_MODE && cachedUnpublished() && !hasPreviewToken(),
  )
  const [preview, setPreview] = useState(false)

  // Revelar #root una vez que React pintó su decisión inicial (antes del paint).
  useLayoutEffect(() => {
    revealRoot()
  }, [])

  useEffect(() => {
    if (DEMO_MODE) return
    let mounted = true
    getSiteConfig()
      .then((cfg) => {
        if (!cfg) return
        // Persistir el estado para que la PRÓXIMA carga decida sin parpadear.
        try {
          window.localStorage.setItem(PUB_CACHE_KEY, cfg.published === false ? '0' : '1')
        } catch {
          /* noop */
        }
        if (!mounted) return
        if (cfg.published === false) {
          if (cfg.previewAuthorized === true) {
            setPreview(true)
            setMaintenance(false)
          } else {
            setMaintenance(true)
          }
        } else {
          setMaintenance(false)
        }
      })
      .catch(() => {
        // fail-open SOLO en primera visita (sin cache): si ya sabíamos que estaba despublicado,
        // mantener "en construcción" ante un error de red (no filtrar el sitio).
        if (mounted && !cachedUnpublished()) setMaintenance(false)
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
