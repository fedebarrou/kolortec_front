import { useEffect, useId, useRef } from 'react'

/**
 * KolortecSello — el círculo con la estrella que RUEDA por el borde en diagonal
 * de "Sumate a Kolortec" (pedido del cliente, mockup 2026-10-03: el rodar de la
 * opción A, al revés —de derecha a izquierda— y quieto a la izquierda, sobre el
 * título, como en la C).
 *
 * El borde de la sección (ver .kt-stack-over en index.css) es alto a la derecha
 * y bajo a la izquierda: el sello entra apoyado arriba a la derecha y rueda
 * pendiente abajo. Para que ruede "de verdad" (sin patinar) el giro sale de la
 * distancia recorrida: vueltas = distancia / perímetro. Los números dependen
 * del ancho de la pantalla, así que se miden acá y van al CSS como variables.
 *
 * Arranca la primera vez que la sección entra en pantalla. Con "reducir
 * movimiento" queda directamente en su lugar.
 */
function KolortecSello() {
  const ref = useRef(null)
  const arco = useId().replace(/:/g, '')

  useEffect(() => {
    const el = ref.current
    const host = el?.closest('.kt-stack-over')
    if (!el || !host) return undefined

    const medir = () => {
      const w = host.clientWidth || 1
      // --kt-diag es un clamp(): getPropertyValue devuelve el texto, no los
      // px. Se mide con un elemento de prueba del mismo alto.
      const sonda = document.createElement('div')
      sonda.style.cssText = 'position:absolute;visibility:hidden;height:var(--kt-diag);width:0'
      host.appendChild(sonda)
      const diag = sonda.offsetHeight
      sonda.remove()
      const size = el.offsetWidth || 1
      const x0 = el.offsetLeft + size / 2
      // Arranca apoyado cerca del borde derecho.
      const x1 = w - size * 0.75
      const dx = Math.max(0, x1 - x0)
      // El borde sube hacia la derecha: más a la derecha, más arriba.
      const dy = (diag * dx) / w
      const recorrido = Math.hypot(dx, dy)
      el.style.setProperty('--sello-dx', `${dx}px`)
      el.style.setProperty('--sello-dy', `${-dy}px`)
      // Rueda hacia la izquierda (antihorario). El giro es el de ARRANQUE y
      // termina en 0°: así queda siempre con "KOLORTEC" derecho, en cualquier
      // ancho (ra VIS-118), y gira justo lo que rueda.
      el.style.setProperty('--sello-giro', `${(recorrido / (Math.PI * size)) * 360}deg`)
    }

    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(host)

    // Arranca cuando el borde de la sección ya subió un tercio de la pantalla.
    // Se chequea en el scroll (no con un IntersectionObserver al montar):
    // mientras la página carga, las secciones de arriba todavía no tienen
    // alto y esta queda un instante en pantalla — el sello rodaba solo, antes
    // de que nadie llegara (mismo problema que la intro de la amarilla).
    const chequear = () => {
      const top = host.getBoundingClientRect().top
      if (top > window.innerHeight * 0.67 || top < -host.offsetHeight) return
      medir()
      el.classList.add('is-on')
      window.removeEventListener('scroll', chequear)
    }
    window.addEventListener('scroll', chequear, { passive: true })
    // Si se llega con la sección ya en pantalla y no se scrollea más (un
    // anclaje, un salto), igual tiene que aparecer (ra VIS-119). Se espera a
    // que la página termine de acomodarse: chequear al montar es justo lo que
    // lo hacía rodar solo durante la carga.
    const diferido = window.setTimeout(chequear, 1800)

    return () => { ro.disconnect(); window.clearTimeout(diferido); window.removeEventListener('scroll', chequear) }
  }, [])

  return (
    <div ref={ref} className="kt-sello" aria-hidden="true">
      <svg viewBox="0 0 100 100">
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
    </div>
  )
}

export default KolortecSello
