import { useEffect } from 'react'

/**
 * Observer global de reveal-on-scroll. Se monta una sola vez (en LandingChrome)
 * y cubre toda la web, incluyendo paginas cargadas con lazy/Suspense gracias a
 * un MutationObserver que detecta nodos nuevos.
 *
 * Anima cualquier elemento con la clase `.kt-section-reveal` (secciones grandes
 * del landing) o `.kt-reveal` (resto del sitio): al entrar al viewport les agrega
 * `.is-visible`. Respeta `prefers-reduced-motion`.
 */
const REVEAL_SELECTOR = '.kt-section-reveal, .kt-reveal'

export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return undefined
    }

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    const register = (el) => {
      if (el.classList.contains('is-visible')) return
      if (prefersReduced) {
        el.classList.add('is-visible')
        return
      }
      io.observe(el)
    }

    const scan = (root) => {
      if (!(root instanceof Element)) return
      if (root.matches && root.matches(REVEAL_SELECTOR)) register(root)
      if (root.querySelectorAll) root.querySelectorAll(REVEAL_SELECTOR).forEach(register)
    }

    document.querySelectorAll(REVEAL_SELECTOR).forEach(register)

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(scan)
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}

export default useScrollReveal
