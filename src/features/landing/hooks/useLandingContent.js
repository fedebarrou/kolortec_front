import { useEffect, useState } from 'react'
import { defaultLandingContent, emptyLandingContent } from '../data/landingData'
import { getLandingContent } from '../../../shared/services/contentService'
import { DEMO_MODE } from '../../../config.js'

export function useLandingContent() {
  // En modo real arrancamos VACÍO (sin demos) → el scrollytelling hace de colchón
  // mientras carga la API; así no hay flash demo→real. En DEMO_MODE (vidriera) sí
  // mostramos los datos mock desde el 0ms.
  const [content, setContent] = useState(DEMO_MODE ? defaultLandingContent : emptyLandingContent)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await getLandingContent()
        if (mounted) {
          setContent(response)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return { content, loading, error }
}
