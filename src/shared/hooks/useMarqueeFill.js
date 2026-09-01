import { useEffect, useRef, useState } from 'react'
import { evenRepeatsFor } from '../utils/marquee'

/**
 * useMarqueeFill — cuántas veces repetir el set base para que la tira NUNCA se vea
 * con un hueco.
 *
 * El keyframe `kt-marquee-scroll` desplaza el track un -50%, así que la MITAD del
 * track es lo que tiene que alcanzar para tapar el ancho visible en todo momento.
 * Repetir el set un número fijo de veces no alcanza porque el ancho de un item
 * depende del contenido (el nombre de la marca, el logo) y del monitor: con 4
 * marcas, media pista mide ~1770px y en una pantalla de 2560 se ve el vacío
 * girando. Que es exactamente el "el carrusel tiene que estar siempre completo".
 *
 * Por eso se MIDE: ancho de un set = scrollWidth / repeticiones actuales, y se
 * repite hasta cubrir el contenedor. Converge en una pasada — el ancho del set no
 * cambia cuando cambian las repeticiones.
 *
 * @param {number} baseCount  items del set base
 * @param {number} minItems   piso para el primer paint, antes de medir
 * @returns {[import('react').RefObject, number]} ref del contenedor .kt-marquee y repeticiones
 */
export function useMarqueeFill(baseCount, minItems = 12) {
  const ref = useRef(null)
  const [repeats, setRepeats] = useState(() => evenRepeatsFor(baseCount, minItems))
  // El efecto de medición no depende de `repeats` (lo lee por ref) para no
  // re-suscribir el observer en cada ajuste, que es como se arma un loop. El ref
  // se sincroniza en su propio efecto: escribirlo durante el render es un
  // side-effect en fase de render.
  const repeatsRef = useRef(repeats)
  useEffect(() => {
    repeatsRef.current = repeats
  }, [repeats])

  useEffect(() => {
    const el = ref.current
    if (!el || !baseCount) return undefined

    const medir = () => {
      const track = el.querySelector('.kt-marquee-track')
      if (!track) return
      const anchoSet = track.scrollWidth / repeatsRef.current
      // Antes de que carguen los logos el track puede medir 0: sin esto la cuenta
      // se dispara al infinito.
      if (!Number.isFinite(anchoSet) || anchoSet <= 1) return
      // +2px de colchón para el redondeo sub-pixel del zoom del canvas.
      const necesarios = Math.max(2, 2 * Math.ceil((el.clientWidth + 2) / anchoSet))
      if (necesarios !== repeatsRef.current) setRepeats(necesarios)
    }

    // Se observan los DOS: el contenedor (cambia con el viewport) y el track
    // (cambia cuando entran las imágenes y recién ahí el ancho es el real).
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    const track = el.querySelector('.kt-marquee-track')
    if (track) ro.observe(track)

    return () => ro.disconnect()
  }, [baseCount])

  return [ref, repeats]
}
