import { useEffect, useState } from 'react'
import { defaultLandingContent } from '../data/landingData'
import { getLandingContent } from '../../../shared/services/contentService'

export function useLandingContent() {
  const [content, setContent] = useState(defaultLandingContent)
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
