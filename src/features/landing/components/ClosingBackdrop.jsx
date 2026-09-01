import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * ClosingBackdrop — la foto del show como fondo FIJO de la página, detrás del
 * cierre (Sumate y Contactanos).
 *
 * Es, literalmente, lo que hace Cloudbeds en "Growth is easier with the right
 * partner":
 *
 *     background-image: url(...);
 *     background-attachment: fixed;
 *     background-size: cover;
 *     background-color: <color de la página>;
 *
 * más tres degradados que funden la foto contra el color de la página en los
 * bordes. El contenido va ENCIMA y A TODO EL ANCHO, sin tocarse: las secciones
 * de adentro se siguen viendo exactamente como cuando el fondo era negro.
 *
 * `background-attachment: fixed` es lo que fija la imagen: el fondo se posiciona
 * contra el viewport, así que al scrollear el contenido pasa por delante de una
 * foto que no se mueve. (Es también el motivo por el que Cloudbeds llama al
 * archivo "img-home-parallax".) En pantallas chicas se degrada a `scroll`: iOS
 * ignora `fixed` al scrollear y el resultado ahí es peor que no tenerlo.
 *
 * El bloque mantiene el ancho del lienzo —el contenido tiene que seguir alineado
 * con el resto de la home— y el que rompe a sangre es SOLO la capa del fondo.
 */
function ClosingBackdrop({ images, children }) {
  const lista = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)),
    [images],
  )
  const [src, setSrc] = useState(null)
  const fondoRef = useRef(null)
  useFullBleed(fondoRef, !!src)

  // Se elige la imagen ANTES de pintarla, probando cada URL: si la primera no
  // carga (en dev varias de la galería devuelven 403) pasa a la siguiente, y si
  // se acaban no hay fondo — mejor negro que un rectángulo roto.
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
    <div className="kt-closing-backdrop">
      {src ? (
        <div
          ref={fondoRef}
          className="kt-closing-backdrop-bg"
          aria-hidden="true"
          style={{ backgroundImage: `url("${src}")` }}
        >
          {/* Los tres fundidos contra el negro de la página: sin ellos la foto
              corta con un borde duro contra lo de arriba y contra el footer. */}
          <span className="kt-closing-fade-top" />
          <span className="kt-closing-fade-bottom" />
          <span className="kt-closing-fade-sides" />
        </div>
      ) : null}
      <div className="kt-closing-backdrop-content">{children}</div>
    </div>
  )
}

export default ClosingBackdrop
