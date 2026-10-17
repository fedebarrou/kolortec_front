import { useCallback } from 'react'

/**
 * useRevealSections — reveal-on-scroll de las secciones de UN contenedor, incluidas las que
 * se montan tarde. Devuelve un ref callback: `<div ref={useRevealSections()}>`.
 *
 * Por qué existe (VIS-001, 17-oct): la ficha de producto armaba su observer en un efecto con
 * deps a mano ([product, productBlogs.length]). «Notas relacionadas» y «En obra» se montan
 * cuando resuelve SU propio fetch, después de ese efecto; cada sección tardía obligaba a sumar
 * otra dep, y la que faltaba quedaba en opacity:0 PARA SIEMPRE. Acá no hay lista de deps: un
 * MutationObserver sobre el contenedor engancha al IntersectionObserver todo nodo que matchee
 * `selector` en el momento en que aparece, sea cuando sea.
 *
 * Contrato con el CSS: el nodo recibe `.is-visible` al entrar al viewport (index.css
 * `.kt-detail-anim.is-visible`) y `--reveal-delay` escalonado (tope 280 ms, por orden de
 * aparición dentro de cada tanda). Sin IntersectionObserver revela todo de entrada.
 *
 * ⚠ Mismo límite que useScrollReveal: un nodo MUY alto (más de ~10 viewports) no llega al
 * umbral. Las secciones de la ficha están muy por debajo de eso.
 */
export const REVEAL_SELECTOR = '.kt-detail-anim, .kt-graphene-separator'

export function useRevealSections(selector = REVEAL_SELECTOR) {
  // React 19: el ref callback puede devolver su cleanup (se llama al desmontar o al cambiar de nodo).
  return useCallback(
    (scope) => {
      if (!scope) return undefined

      const sinIO = typeof IntersectionObserver === 'undefined'
      const vistos = new WeakSet()

      const io = sinIO
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                entry.target.classList.add('is-visible')
                io.unobserve(entry.target)
              })
            },
            { threshold: 0.08, rootMargin: '0px 0px -14% 0px' },
          )

      const enganchar = () => {
        const nuevos = Array.from(scope.querySelectorAll(selector)).filter((n) => !vistos.has(n))
        nuevos.forEach((node, i) => {
          vistos.add(node)
          node.style.setProperty('--reveal-delay', `${Math.min(i * 55, 280)}ms`)
          if (node.classList.contains('is-visible')) return
          if (io) io.observe(node)
          else node.classList.add('is-visible')
        })
      }

      enganchar()
      const mo = new MutationObserver((muts) => {
        if (muts.some((m) => m.addedNodes.length > 0)) enganchar()
      })
      mo.observe(scope, { childList: true, subtree: true })

      return () => {
        mo.disconnect()
        if (io) io.disconnect()
      }
    },
    [selector],
  )
}

export default useRevealSections
