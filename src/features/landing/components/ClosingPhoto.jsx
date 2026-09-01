import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * ClosingPhoto — la foto grande antes del footer, con parallax.
 *
 * El cierre de la home venía siendo texto sobre negro hasta el pie. Una marca que
 * fabrica luces para espectáculo cierra MOSTRANDO lo que hace: un show lleno, con
 * los haces trabajando. Es el mismo recurso que usa Cloudbeds antes de su pie.
 *
 * La foto por defecto es un frame del scrolltelling (`f150`): el estadio con la
 * gente y los haces cruzados. Se eligió a mano y no de la galería de la cuenta
 * porque la galería son fotos de PRODUCTO —un clamp, un bidón de líquido de
 * humo— y de cierre no dicen nada. Las de la galería quedan igual como respaldo,
 * por si algún día la cuenta carga fotos de eventos: para cambiarla, alcanza con
 * pasar otra URL primera en `images`.
 *
 * PARALLAX: la imagen es más alta que la sección y se desplaza más lento que el
 * scroll, así que el fondo "queda atrás" y aparece profundidad — no es una foto
 * pegada ni un `background-attachment: fixed` (que tiembla en iOS y obliga al
 * navegador a repintar toda la capa).
 *
 * La imagen se elige ANTES de renderizar, probando cada URL con `new Image()`, y
 * no con el `onError` del <img> pintado: ese evento es poco confiable con
 * `loading="lazy"` y dejaba la cascada clavada en la primera. (En dev varias de
 * la galería devuelven 403.)
 */

/** Cuánto se mueve la foto respecto del scroll. 0 = fija, 1 = pegada al scroll. */
const FACTOR = 0.28

function ClosingPhoto({ images, alt }) {
  const lista = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)),
    [images],
  )
  const [src, setSrc] = useState(null)
  const ref = useRef(null)
  const imgRef = useRef(null)
  useFullBleed(ref, !!src)

  useEffect(() => {
    let cancelado = false

    const probar = (i) => {
      if (cancelado || i >= lista.length) return
      const img = new Image()
      img.onload = () => { if (!cancelado) setSrc(lista[i]) }
      img.onerror = () => probar(i + 1)
      img.src = lista[i]
    }

    probar(0)
    return () => { cancelado = true }
  }, [lista])

  // Parallax. Se escribe directo en el nodo desde un rAF y no por estado de React:
  // es una corrección por frame atada al scroll, no algo que deba re-renderizar.
  useEffect(() => {
    const seccion = ref.current
    const img = imgRef.current
    if (!src || !seccion || !img) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    const mover = () => {
      frame = 0
      const caja = seccion.getBoundingClientRect()
      // Sólo mientras la sección está a la vista: fuera de pantalla no hay nada
      // que mover y no vale la pena tocar el layout.
      if (caja.bottom < 0 || caja.top > window.innerHeight) return
      // Progreso de -1 a 1 según dónde está el centro de la sección respecto del
      // centro de la pantalla. En el medio vale 0, o sea la foto centrada.
      const centro = caja.top + caja.height / 2
      const avance = (centro - window.innerHeight / 2) / (window.innerHeight / 2 + caja.height / 2)
      img.style.transform = `translate3d(0, ${(avance * FACTOR * caja.height).toFixed(1)}px, 0)`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(mover) }

    mover()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [src])

  if (!src) return null

  return (
    <section ref={ref} className="kt-closing-photo" aria-hidden="true">
      <img ref={imgRef} src={src} alt={alt || ''} decoding="async" />
      {/* Degradado inferior: la foto tiene que MORIR en el negro del footer, no
          cortarse con un borde duro contra él. */}
      <span className="kt-closing-photo-fade" />
    </section>
  )
}

export default ClosingPhoto
