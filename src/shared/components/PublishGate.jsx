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
// Distintivo de vista previa. Era una cinta amarilla a todo el ancho pegada arriba, y en un
// sitio cuyo hero ocupa la pantalla entera eso es lo primero que se ve: le comía el arranque
// al diseño. Ahora es una pastilla chica abajo a la izquierda (el flotante de WhatsApp vive a
// la derecha) que se puede cerrar.
//
// Los estilos van EN LÍNEA a propósito: este cartel tiene que aparecer aunque el CSS del sitio
// no haya cargado — que es exactamente el escenario que nos hizo perder una tarde.
function PreviewRibbon() {
  // `sessionStorage` y no `localStorage`: cerrarla la calla mientras mirás, pero en la próxima
  // visita vuelve. Que la web está despublicada no es algo que convenga olvidarse para siempre.
  const [cerrada, setCerrada] = useState(() => {
    try {
      return window.sessionStorage.getItem('kt:preview-pill') === 'off'
    } catch {
      return false
    }
  })

  if (cerrada) return null

  const cerrar = () => {
    setCerrada(true)
    try {
      window.sessionStorage.setItem('kt:preview-pill', 'off')
    } catch {
      /* modo privado: se cierra igual, nada más que no se recuerda */
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        // `max()` con el safe-area: en un iPhone la barra de gestos se come los 14px.
        bottom: 'max(14px, env(safe-area-inset-bottom))',
        left: 'max(14px, env(safe-area-inset-left))',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 'calc(100vw - 28px)',
        background: 'rgba(14,14,16,.82)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
        color: '#f2f2f2',
        border: '1px solid rgba(244,223,51,.45)',
        borderRadius: 999,
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '.01em',
        padding: '7px 8px 7px 12px',
        boxShadow: '0 6px 20px rgba(0,0,0,.4)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          flex: 'none',
          borderRadius: '50%',
          background: '#f4df33',
        }}
      />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Vista previa — sin publicar
      </span>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Ocultar el aviso de vista previa"
        style={{
          flex: 'none',
          width: 20,
          height: 20,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          border: 0,
          background: 'rgba(255,255,255,.1)',
          color: 'inherit',
          fontSize: 13,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
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
