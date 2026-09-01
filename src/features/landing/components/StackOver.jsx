import { useRef } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'

/**
 * StackOver — el bloque que SUBE por encima de la sección clavada (.kt-stack-pin).
 *
 * Va A SANGRE, igual que la amarilla que tapa. Dos motivos:
 *
 *  1. Para que TAPE. Si deja ver la sección de abajo por los costados no parece
 *     que una cubra a la otra, parece un error.
 *  2. Para que los textos ALINEEN. Antes sólo el fondo rompía el lienzo y el
 *     contenido se quedaba adentro de los 1920: en un monitor 2K el título de la
 *     amarilla arrancaba a 160px del borde de la pantalla y el de Sumate a 480px,
 *     porque su gutter contaba desde el borde del lienzo y no desde el de la
 *     pantalla. Se veían dos anchos distintos. Ahora las dos secciones miden lo
 *     mismo y su `lg:px-40` cuenta desde el mismo lugar.
 */
function StackOver({ children }) {
  const ref = useRef(null)
  useFullBleed(ref)

  return (
    <div ref={ref} className="kt-stack-over">
      {children}
    </div>
  )
}

export default StackOver
