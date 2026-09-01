import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Rail — riel horizontal con scroll-snap y flechas.
 *
 * Es el patrón "slides" del sitio para listas cortas que NO tienen que girar
 * solas: a diferencia de .kt-marquee (loop infinito, decorativo), acá el
 * visitante manda — arrastra, usa la rueda, tabula o toca las flechas — y cada
 * item queda encajado. Se usa donde el contenido se lee, no se mira pasar.
 *
 * Las flechas se ocultan cuando no hay nada que scrollear (todo entra en
 * pantalla), y se deshabilitan al llegar a cada punta: una flecha que no hace
 * nada miente sobre que hay más contenido.
 */
function Rail({ children, label, className = '' }) {
  const railRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const sync = useCallback(() => {
    const el = railRef.current
    if (!el) return
    // 2px de tolerancia: el scroll fraccionario (zoom del canvas, DPI) nunca da
    // el valor exacto y sin el margen la flecha del final queda viva para siempre.
    const max = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 2)
    setCanNext(max > 2 && el.scrollLeft < max - 2)
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return undefined
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [sync, children])

  const move = (dir) => {
    const el = railRef.current
    if (!el) return
    // Un "paso" = casi el ancho visible, dejando un pedazo del item anterior a la
    // vista para que se entienda que es una tira continua y no una paginación.
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.86), behavior: 'smooth' })
  }

  const arrowClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#383838] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909] disabled:cursor-default disabled:opacity-30 disabled:hover:border-[#383838] disabled:hover:bg-transparent disabled:hover:text-[#f2f2f2]'

  return (
    <div className={className}>
      <div ref={railRef} className="kt-rail" role="group" aria-label={label}>
        {children}
      </div>

      {canPrev || canNext ? (
        <div className="mt-4 hidden justify-end gap-2 md:flex">
          <button type="button" className={arrowClass} onClick={() => move(-1)} disabled={!canPrev} aria-label="Anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.2]">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" className={arrowClass} onClick={() => move(1)} disabled={!canNext} aria-label="Siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.2]">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Rail
