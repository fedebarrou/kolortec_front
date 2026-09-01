import { useRef } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * StackOver — el bloque que SUBE por encima de la sección clavada (.kt-stack-pin).
 *
 * Para que el apilado se lea, lo que sube tiene que TAPAR: si deja ver la sección
 * de abajo por los costados, no parece que una cubra a la otra, parece un error.
 * Y acá pasaba exactamente eso: la amarilla es full-bleed (rompe el lienzo de
 * 1920 para tocar los bordes de la pantalla) y Sumate/Contactanos viven dentro
 * del lienzo, así que en un monitor 2K quedaba una franja de amarillo asomando a
 * cada lado.
 *
 * La solución NO es ensanchar el contenido —se desalinearía con el resto de la
 * home, que respeta el lienzo— sino ponerle un FONDO a sangre por detrás. El
 * contenido sigue donde tiene que estar; lo que se estira es el telón.
 */
function StackOver({ children }) {
  const fondoRef = useRef(null)
  useFullBleed(fondoRef)

  return (
    <div className="kt-stack-over">
      <div ref={fondoRef} className="kt-stack-over-bg" aria-hidden="true" />
      {children}
    </div>
  )
}

export default StackOver
