import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * ClosingPhoto — la foto grande antes del footer.
 *
 * El cierre de la home venía siendo texto sobre negro hasta el pie: Sumate,
 * Contactanos, footer. Una marca que fabrica luces para espectáculo termina
 * mostrando lo que hace, no contándolo. Es el mismo recurso que usa Cloudbeds
 * antes de su pie: una imagen a sangre que corta el bloque de texto.
 *
 * Las imágenes salen de la GALERÍA de la cuenta en tiendita, así que se cambian
 * desde el admin sin tocar código. Sin galería —o sin ninguna que cargue— la
 * sección no existe: no se inventa una foto de stock ni se deja un rectángulo
 * roto de 720px de alto justo antes del footer.
 *
 * La elección se hace ANTES de renderizar, probando cada URL con `new Image()`,
 * y no con el `onError` del <img> pintado. Con `loading="lazy"` ese onError es
 * poco confiable —el navegador puede no llegar a pedir la imagen, o reportar el
 * fallo cuando el elemento ya está fuera de pantalla— y la cascada se quedaba
 * clavada en la primera. Acá se prueban en orden y se muestra la primera que
 * realmente cargó. (En dev varias de la galería devuelven 403.)
 */
function ClosingPhoto({ images, alt }) {
  const lista = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)),
    [images],
  )
  const [src, setSrc] = useState(null)
  const ref = useRef(null)
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

  if (!src) return null

  return (
    <section ref={ref} className="kt-closing-photo" aria-hidden="true">
      <img src={src} alt={alt || ''} decoding="async" />
      {/* Degradado inferior: la foto tiene que MORIR en el negro del footer, no
          cortarse con un borde duro contra él. */}
      <span className="kt-closing-photo-fade" />
    </section>
  )
}

export default ClosingPhoto
