import { useEffect } from 'react'

/**
 * useStickyBottom — para un `position: sticky; top: 0` que puede ser MÁS ALTO
 * que la pantalla.
 *
 * Con `top: 0`, un bloque más alto que el viewport se clava por su borde de
 * ARRIBA: lo que tiene abajo nunca se llega a ver, porque lo que sube encima
 * (.kt-stack-over) lo tapa antes. Pasó en el celular con la sección amarilla
 * cuando el modelo 3D bajó debajo del texto.
 *
 * El arreglo es el `top` negativo: `top = alto de pantalla - alto del bloque`.
 * Así se clava cuando su borde de ABAJO toca el fondo de la pantalla — primero
 * se scrollea hasta verlo entero y recién ahí lo de encima empieza a subir.
 * Si entra en la pantalla, el top queda en 0 y no cambia nada.
 */
export function useStickyBottom(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const ajustar = () => {
      const sobra = window.innerHeight - el.offsetHeight
      el.style.top = sobra < 0 ? `${sobra}px` : ''
    }

    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(el)
    window.addEventListener('resize', ajustar)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', ajustar)
      el.style.top = ''
    }
  }, [ref])
}
