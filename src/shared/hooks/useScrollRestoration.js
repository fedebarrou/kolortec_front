import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scroll por entrada del historial, para las páginas de catálogo.
 *
 * Por qué existe: el catálogo y la categoría cargan los productos DESPUÉS de montar,
 * así que cuando el navegador vuelve atrás (POP) e intenta restaurar el scroll, la
 * página todavía no tiene alto y queda arriba de todo. Encima cada página hacía
 * `scrollTo(0)` al montar, también al volver. Resultado: «atrás» desde una ficha te
 * dejaba al principio de la categoría y había que buscar de nuevo dónde estabas.
 *
 * - Guarda `scrollY` en sessionStorage con la `location.key` de la entrada actual.
 * - Cuando `ready` pasa a true y a la página (`pageKey`, p. ej. el slug de la
 *   categoría) se llegó con un POP, restaura el scroll guardado una sola vez.
 * - La página sigue haciendo su `scrollTo(0)`, pero sólo si NO se llegó con POP
 *   (ver `useNavigationType` en CategoryPage / ShopPage).
 */
const PREFIX = 'kt-scroll:'

function leer(key) {
  try {
    const v = window.sessionStorage.getItem(PREFIX + key)
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}

function guardar(key, y) {
  try {
    window.sessionStorage.setItem(PREFIX + key, String(Math.round(y)))
  } catch {
    /* modo privado / storage bloqueado: sin restauración, nada se rompe */
  }
}

export function useScrollRestoration(ready, pageKey = '') {
  const location = useLocation()
  const navigationType = useNavigationType()
  const keyRef = useRef(location.key)
  // Con qué tipo de navegación se ENTRÓ a esta página (por pageKey). Un cambio de
  // filtro (navigate replace dentro de la misma página) no lo pisa; pasar a otra
  // categoría sin desmontar (mismo componente, otro slug) sí arranca de cero.
  const paginaRef = useRef({ entrada: null, restaurado: true })
  useLayoutEffect(() => {
    paginaRef.current = { entrada: navigationType, restaurado: false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se captura al ENTRAR a la página, no en cada replace
  }, [pageKey])

  // La key sigue a la entrada actual: los filtros reemplazan la entrada (replace)
  // y el scroll se tiene que guardar bajo la nueva, que es a la que se vuelve.
  useLayoutEffect(() => {
    keyRef.current = location.key
  }, [location.key])

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        guardar(keyRef.current, window.scrollY)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const pagina = paginaRef.current
    if (!ready || pagina.restaurado) return
    pagina.restaurado = true
    if (pagina.entrada !== 'POP') return
    const y = leer(keyRef.current)
    if (y == null || y <= 0) return
    // Un frame para que la grilla recién pintada tenga su alto real.
    window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }))
  }, [ready, pageKey])
}
