import { useEffect, useRef } from 'react'
import { scrollBleedWidth, viewportScale } from '../../features/landing/_hero-renderer/scroll-contract'

/**
 * useFullBleed — rompe una sección al ANCHO REAL de la pantalla.
 *
 * Hace falta porque el sitio se maqueta dentro de `.kt-zoom-canvas`: un lienzo
 * de 1920px fijos con `zoom: min(1, vw/1920)`. Debajo de 1920 el lienzo ocupa
 * toda la pantalla, pero ARRIBA de 1920 (un monitor 2K o 4K) el zoom queda en 1
 * y el lienzo se centra: una sección "de punta a punta" termina con bandas
 * negras de cientos de píxeles a los costados.
 *
 * No se resuelve con `width: 100vw`: adentro de un `zoom: s` hay que pedir 1/s
 * para ocupar el ancho real, y `vw` además incluye la barra de scroll. Por eso se
 * usa `scrollBleedWidth()` (clientWidth / escala), el mismo helper del renderer
 * del hero — misma cuenta, un solo lugar donde puede estar mal.
 *
 * El margen izquierdo NO se calcula con el 50% del padre: eso asume que el
 * contenedor está centrado, y cuando la ventana es más angosta que 1920 el
 * lienzo desborda hacia la derecha en vez de centrarse. Se corrige contra la
 * posición REAL medida — cada pasada resta lo que al elemento le falta para
 * tocar el borde izquierdo. Converge en un paso.
 *
 * Se escribe DIRECTO en el nodo y no por estado de React: depende de medir el
 * layout ya pintado. React no lo pisa, porque nunca pone width/marginLeft en el
 * `style` de esta sección.
 */
export function useFullBleed(ref, enabled = true) {
  const marginRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) {
      if (el) {
        el.style.width = ''
        el.style.maxWidth = ''
        el.style.marginLeft = ''
      }
      marginRef.current = 0
      return undefined
    }

    const medir = () => {
      const nodo = ref.current
      if (!nodo) return
      const ancho = scrollBleedWidth()
      if (!ancho) return
      const desvio = nodo.getBoundingClientRect().left / viewportScale()
      const ml = Math.abs(desvio) < 0.5 ? marginRef.current : marginRef.current - desvio
      marginRef.current = ml
      nodo.style.width = `${ancho}px`
      nodo.style.maxWidth = 'none'
      nodo.style.marginLeft = `${ml}px`
    }

    medir()
    window.addEventListener('resize', medir, { passive: true })

    // ResizeObserver sobre la PROPIA sección y sobre el body. Ojo: observar
    // `document.documentElement` acá NO sirve — en esta página no dispara ni la
    // observación inicial (comprobado en el navegador), así que el momento en que
    // aparece la barra de scroll pasaba desapercibido.
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    ro.observe(document.body)

    // Repescas acotadas. Al primer render la sección se mide ANTES de que el
    // documento crezca lo suficiente para que aparezca la barra de scroll
    // vertical: con ese ancho de más (10px) quedaba corrida y dejaba una franja
    // negra contra el borde derecho. Y ese momento no lo avisa NADIE: la barra no
    // dispara `resize`.
    //
    // Acá el documento cambia de alto varias veces después del primer paint (la
    // pantalla de carga que se va, el spacer del scrolltelling cuando resuelve la
    // API, las fuentes), así que se re-mide en una ventana corta. `medir()` es
    // idempotente: si ya está bien no toca nada.
    const frame = requestAnimationFrame(medir)
    const repescas = [400, 1200, 2500, 5000].map((ms) => window.setTimeout(medir, ms))

    return () => {
      cancelAnimationFrame(frame)
      repescas.forEach(window.clearTimeout)
      window.removeEventListener('resize', medir)
      ro.disconnect()
    }
  }, [ref, enabled])
}

export default useFullBleed
