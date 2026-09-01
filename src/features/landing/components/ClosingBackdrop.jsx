import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * ClosingBackdrop — la foto del show como FONDO del cierre de la home.
 *
 * No es una franja de foto entre secciones: es el paisaje que queda ATRÁS, desde
 * Contactanos hasta el pie. El contenido va encima y la foto se mueve más lento
 * que el scroll, así que el fondo "queda atrás" y aparece profundidad — el mismo
 * recurso que un paisaje detrás de una escena.
 *
 * La primera versión era una sección aparte, una foto a sangre metida entre
 * Contactanos y el footer. Se veía como una imagen suelta, no como fondo: la foto
 * empujaba, no acompañaba.
 *
 * Por qué no `background-attachment: fixed`, que sería lo obvio: tiembla en iOS
 * (Safari lo ignora en scroll), obliga al navegador a repintar la capa entera en
 * cada frame, y no se puede graduar la velocidad. Acá la imagen es más alta que
 * el bloque y se desplaza por `transform`, que va en la GPU.
 *
 * El scrim no es decoración: sobre una foto de show con haces blancos el texto
 * blanco de Contactanos desaparece. Arranca en negro pleno (para que la costura
 * con la sección de arriba sea un fundido y no un borde) y muere en el negro del
 * footer.
 */

/** Cuánto se mueve la foto respecto del scroll. 0 = fija, 1 = pegada al scroll. */
const FACTOR = 0.22

function ClosingBackdrop({ images, children }) {
  const lista = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)),
    [images],
  )
  const [src, setSrc] = useState(null)
  const ref = useRef(null)
  const fondoRef = useRef(null)
  const imgRef = useRef(null)
  // El bloque mantiene el ancho del lienzo (el contenido tiene que seguir
  // alineado con el resto de la home); el que rompe a sangre es el FONDO.
  useFullBleed(fondoRef, !!src)

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

  // Parallax. Se escribe directo en el nodo desde un rAF y no por estado de
  // React: es una corrección por frame atada al scroll, no algo que re-renderice.
  useEffect(() => {
    const bloque = ref.current
    const img = imgRef.current
    if (!src || !bloque || !img) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    const mover = () => {
      frame = 0
      const caja = bloque.getBoundingClientRect()
      // Fuera de pantalla no hay nada que mover.
      if (caja.bottom < 0 || caja.top > window.innerHeight) return
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

  return (
    <div ref={ref} className={`kt-closing-backdrop ${src ? 'has-photo' : ''}`}>
      {src ? (
        <div ref={fondoRef} className="kt-closing-backdrop-bg" aria-hidden="true">
          <img ref={imgRef} src={src} alt="" decoding="async" />
          <span className="kt-closing-backdrop-scrim" />
        </div>
      ) : null}
      <div className="kt-closing-backdrop-content">{children}</div>
    </div>
  )
}

export default ClosingBackdrop
