import { useEffect } from 'react'

/**
 * useScrollReveal — observer global de reveal-on-scroll.
 *
 * Agrega `.is-visible` a los elementos `.kt-reveal` / `.kt-section-reveal`
 * cuando entran al viewport (estilos en index.css). Se monta una sola vez
 * (LandingChrome). Re-escanea el DOM ante contenido que aparece async (fetch),
 * y desobserva cada elemento al revelarlo.
 */
export function useScrollReveal(selector = '.kt-reveal, .kt-section-reveal') {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Sin soporte: revelá todo para no dejar contenido invisible.
      if (typeof document !== 'undefined') {
        document.querySelectorAll(selector).forEach((el) => el.classList.add('is-visible'))
      }
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    const observeAll = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.classList.contains('is-visible')) io.observe(el)
      })
    }

    observeAll()

    // Cubre secciones que se montan después (datos async del adapter).
    const mo = new MutationObserver(() => observeAll())
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [selector])
}

export default useScrollReveal
