import { useId } from 'react'

/**
 * El asterisco de la marca, calcado del logo original (public/assets/logo_minimal.png):
 * seis brazos que se ENSANCHAN hacia afuera, con un brazo horizontal y los otros
 * cuatro a ±60°. El dibujo anterior eran tres barras «moño» con un brazo VERTICAL:
 * otro asterisco, que es lo que el cliente notó («el logo no es el original»).
 * Centrado en 0,0 y entra en un cuadro de -50..50.
 */
export const ASTERISCO_KOLORTEC =
  '0,-13.8 16.7,-47.9 33.8,-37.5 12.9,-7.5 49.6,-10.4 49.6,10.4 12.9,7.5 33.8,37.5 16.7,47.9 0,13.8 -16.7,47.9 -33.8,37.5 -12.9,7.5 -49.6,10.4 -49.6,-10.4 -12.9,-7.5 -33.8,-37.5 -16.7,-47.9'

/**
 * SelloKolortec — el círculo negro con la estrella amarilla y "KOLORTEC · READY
 * TO WORK" en arco. Es la pieza gráfica que rueda por la diagonal de "Sumate"
 * (KolortecSello) y el botón de volver arriba del footer: un solo dibujo para
 * los dos, así no se desfasan.
 *
 * Toma el tamaño de su contenedor (width/height 100%). Colores con los tokens
 * del sitio (--bg, --primary).
 */
function SelloKolortec({ className = '' }) {
  const arco = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <path id={arco} d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
      </defs>
      <circle cx="50" cy="50" r="49" style={{ fill: 'var(--bg, #050505)', stroke: 'var(--primary, #f4df33)' }} strokeWidth="2" />
      <text fontFamily="FuturaExtraBlackCondensed, Impact, sans-serif" fontWeight="900" fontSize="10" letterSpacing="3.2" style={{ fill: 'var(--primary, #f4df33)' }}>
        <textPath href={`#${arco}`}>KOLORTEC · READY TO WORK · </textPath>
      </text>
      <g style={{ fill: 'var(--primary, #f4df33)' }} transform="translate(50 50) scale(0.37)">
        <polygon points={ASTERISCO_KOLORTEC} />
      </g>
    </svg>
  )
}

export default SelloKolortec
