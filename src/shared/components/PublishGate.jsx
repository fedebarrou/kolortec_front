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
 */
function PublishGate({ children }) {
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) return
    let mounted = true
    getSiteConfig()
      .then((cfg) => {
        if (mounted && cfg && cfg.published === false) setMaintenance(true)
      })
      .catch(() => {
        /* fail-open: dejar la web visible ante error de red */
      })
    return () => {
      mounted = false
    }
  }, [])

  return maintenance ? <MaintenancePage /> : children
}

export default PublishGate
