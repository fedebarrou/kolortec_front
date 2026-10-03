import { useId } from 'react'

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
      <g style={{ fill: 'var(--primary, #f4df33)' }} transform="translate(50 50) scale(0.42)">
        <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" />
        <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" transform="rotate(60)" />
        <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" transform="rotate(120)" />
      </g>
    </svg>
  )
}

export default SelloKolortec
