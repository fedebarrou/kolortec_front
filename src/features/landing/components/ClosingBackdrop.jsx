import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * ClosingBackdrop — la foto del show como fondo FIJO del cierre de la home.
 *
 * La imagen se queda QUIETA y el contenido pasa por encima: Sumate y Contactanos
 * scrollean sobre una foto que no se mueve. Es lo que hace Cloudbeds en "Growth
 * is easier with the right partner" y lo que pidió el cliente — no un parallax
 * (que fue el intento anterior: la foto se movía más lento, pero se movía).
 *
 * Cómo se fija, y por qué NO con `background-attachment: fixed`, que sería lo
 * obvio: Safari lo ignora al scrollear (en iOS queda pegado o tiembla) y obliga
 * al navegador a repintar la capa entera en cada frame. Acá el truco es un
 * `position: sticky` de un alto de pantalla adentro de un contenedor recortado:
 * la imagen se pega arriba mientras el bloque pasa, que es exactamente el mismo
 * efecto, va en la GPU y funciona igual en todos lados.
 *
 * El alto se divide por la escala del lienzo (`--kt-canvas-scale`) por lo mismo
 * que el hero: adentro de un `zoom: s` hay que pedir 1/s para ocupar la pantalla.
 *
 * La foto se ve A FULL, sin velo encima. La legibilidad la resuelven las TARJETAS
 * sólidas del contenido (ver `.kt-closing-card` en index.css): un scrim sobre la
 * imagen no deja una foto, deja una mancha oscura.
 */
function ClosingBackdrop({ images, children }) {
  const lista = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)),
    [images],
  )
  const [src, setSrc] = useState(null)
  const fondoRef = useRef(null)
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

  return (
    <div className={`kt-closing-backdrop ${src ? 'has-photo' : ''}`}>
      {src ? (
        <div ref={fondoRef} className="kt-closing-backdrop-bg" aria-hidden="true">
          <div className="kt-closing-backdrop-fixed">
            <img src={src} alt="" decoding="async" />
            <span className="kt-closing-backdrop-scrim" />
          </div>
        </div>
      ) : null}
      <div className="kt-closing-backdrop-content">{children}</div>
    </div>
  )
}

export default ClosingBackdrop
