import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import InnovacionIcono from './InnovacionIcono'
import { POR_PAGINA, paginar, paginaDesdeScroll } from '../../../shared/utils/innovaciones-grilla'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * InnovacionesGrilla — las innovaciones de la ficha cuando son MUCHAS (5 o más; hasta 4 va la lista de
 * siempre, la decide ProductDetailPage con usaGrilla). Mockup 2026-10-20-innovaciones, opción B.
 *
 * Un solo DOM, dos presentaciones por CSS (.kt-innov-* en index.css, corte en 768px como el resto del repo):
 *   · compu (≥768px): grilla de fichas compactas; la explicación sale en un globo al pasar el mouse o con foco.
 *   · celular: las fichas en páginas de 6 (2×3) con scroll-snap horizontal nativo; tocar una abre/cierra su
 *     explicación (una sola a la vez); puntos + «1 / N» sincronizados con el scroll.
 *
 * El globo es UNO solo, fuera del scroller (un `overflow-x: auto` recorta lo que sobresale hacia abajo),
 * posicionado según la ficha abierta. Las fichas son <button aria-expanded aria-controls>; Escape cierra.
 * Una innovación sin descripción no tiene nada que abrir: es una ficha sin botón.
 */

const CORTE_COMPU = '(min-width: 768px)'
const suscribirCompu = (cb) => {
  const mql = window.matchMedia(CORTE_COMPU)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const esCompu = () => window.matchMedia(CORTE_COMPU).matches
// Servidor / pre-render: se asume compu; el layout lo decide el CSS igual, esto sólo afecta atributos aria.
const esCompuServidor = () => true

const plantilla = (texto, vars) => texto.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

function InnovacionesGrilla({ items }) {
  const { t } = useLanguage()
  const compu = useSyncExternalStore(suscribirCompu, esCompu, esCompuServidor)
  const idGlobo = useId()
  const raizRef = useRef(null)
  const pistaRef = useRef(null)
  const ultimoPuntero = useRef('mouse')
  const ignorarScroll = useRef(false) // el scroll que provoca un foco no debe cerrar el globo recién abierto
  const [abierta, setAbierta] = useState(null) // { i, top, left, width } de la ficha con explicación abierta
  const [pagina, setPagina] = useState(0)

  const paginas = useMemo(() => paginar(items), [items])
  const total = paginas.length
  const celu = !compu

  const abrir = useCallback((i, boton) => {
    const raiz = raizRef.current
    if (!raiz) return
    const r = raiz.getBoundingClientRect()
    const b = boton.getBoundingClientRect()
    const top = b.bottom - r.top + 6
    // Compu: el globo tiene el ancho de su ficha. Celular: el ancho de toda la grilla (más corto de leer).
    setAbierta(esCompu() ? { i, top, left: b.left - r.left, width: b.width } : { i, top, left: 0, width: r.width })
  }, [])

  // Escape cierra (con el mouse el foco no está en la ficha); tocar afuera también.
  useEffect(() => {
    if (!abierta) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setAbierta(null)
    }
    const onPuntero = (e) => {
      if (raizRef.current && !raizRef.current.contains(e.target)) setAbierta(null)
    }
    const onResize = () => setAbierta(null)
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPuntero)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPuntero)
      window.removeEventListener('resize', onResize)
    }
  }, [abierta])

  const onScroll = () => {
    const pista = pistaRef.current
    if (!pista || total < 2) return
    const slides = pista.children
    const nueva = paginaDesdeScroll({
      scrollLeft: pista.scrollLeft,
      paso: slides[1].offsetLeft - slides[0].offsetLeft,
      clientWidth: pista.clientWidth,
      scrollWidth: pista.scrollWidth,
      total,
    })
    setPagina(nueva)
    // El globo quedaría suelto si la página se va: se cierra sólo si cambió la página, y no por el
    // scroll que acaba de provocar el foco (Tab hacia una ficha de otra página lo abre y desplaza la pista).
    if (nueva !== pagina && !ignorarScroll.current) setAbierta(null)
  }

  const irA = (n, instantaneo = false) => {
    const pista = pistaRef.current
    if (!pista) return
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pista.scrollTo({ left: pista.children[n].offsetLeft - pista.children[0].offsetLeft, behavior: reducido || instantaneo ? 'auto' : 'smooth' })
  }

  const alternar = (i, boton) => {
    if (abierta?.i === i) setAbierta(null)
    else abrir(i, boton)
  }

  const textoGlobo = abierta ? (items[abierta.i]?.description || '').trim() : ''

  return (
    <div ref={raizRef} className="kt-innov kt-reveal-item">
      <p className="kt-innov-hint">
        <span className="kt-innov-hint-mouse">
          {plantilla(t('productDetail.innovations.hintMouse', '{n} innovaciones · pasá el mouse para ver el detalle'), { n: items.length })}
        </span>
        <span className="kt-innov-hint-tap">
          {plantilla(t('productDetail.innovations.hintTap', '{n} innovaciones · tocá una para ver el detalle'), { n: items.length })}
        </span>
        <span className="kt-innov-hint-tactil">
          {plantilla(t('productDetail.innovations.hintTouch', '{n} innovaciones · deslizá para ver más · tocá una para ver el detalle'), { n: items.length })}
        </span>
      </p>

      <div
        ref={pistaRef}
        className="kt-innov-pista"
        onScroll={onScroll}
        {...(celu
          ? { role: 'group', 'aria-roledescription': 'carrusel', 'aria-label': t('productDetail.innovations.carousel', 'Innovaciones') }
          : {})}
      >
        {paginas.map((fichas, p) => (
          <div
            key={p}
            className={`kt-innov-pagina${total === 1 ? ' kt-innov-pagina--unica' : ''}`}
            {...(celu
              ? {
                  role: 'group',
                  'aria-roledescription': 'diapositiva',
                  'aria-label': plantilla(t('productDetail.innovations.slide', 'Página {i} de {n}'), { i: p + 1, n: total }),
                }
              : {})}
          >
            {fichas.map((inn, j) => {
              const i = p * POR_PAGINA + j
              const inicial = Array.from((inn.title || '').trim())[0]?.toUpperCase() || '·'
              const contenido = (
                <>
                  {inn.image ? (
                    <InnovacionIcono src={inn.image} tamano="h-[34px] w-[34px]" relleno="p-1.5" />
                  ) : (
                    <span className="kt-innov-inicial" aria-hidden="true">
                      {inicial}
                    </span>
                  )}
                  <span className="min-w-0">{inn.title}</span>
                </>
              )
              // Una descripción de sólo espacios es no tener descripción: no hay nada que abrir.
              if (!inn.description?.trim()) {
                return (
                  <div key={i} className="kt-innov-ficha">
                    {contenido}
                  </div>
                )
              }
              const esta = abierta?.i === i
              return (
                <button
                  key={i}
                  type="button"
                  className="kt-innov-ficha"
                  aria-expanded={esta}
                  aria-controls={idGlobo}
                  aria-describedby={esta ? idGlobo : undefined}
                  onPointerDown={(e) => {
                    ultimoPuntero.current = e.pointerType
                  }}
                  onKeyDown={() => {
                    ultimoPuntero.current = 'teclado'
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && esCompu()) abrir(i, e.currentTarget)
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse' && esCompu()) setAbierta(null)
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.matches(':focus-visible')) {
                      ignorarScroll.current = true
                      setTimeout(() => {
                        ignorarScroll.current = false
                      }, 600)
                      // Chrome no desplaza una ficha que asoma a medias (el borde de la página siguiente):
                      // el foco quedaría casi fuera de pantalla. Se lleva la pista a su página.
                      const p = Math.floor(i / POR_PAGINA)
                      if (!esCompu() && p !== pagina) irA(p, true)
                      abrir(i, e.currentTarget)
                    }
                  }}
                  onBlur={() => setAbierta((a) => (a && a.i === i ? null : a))}
                  onClick={(e) => {
                    // Con mouse en compu ya lo abrió el hover; el clic no lo cierra.
                    if (ultimoPuntero.current === 'mouse' && esCompu()) return
                    alternar(i, e.currentTarget)
                  }}
                >
                  {contenido}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div
        id={idGlobo}
        role="tooltip"
        className="kt-innov-globo"
        hidden={!abierta}
        style={abierta ? { top: abierta.top, left: abierta.left, width: abierta.width } : undefined}
      >
        {textoGlobo}
      </div>

      {total > 1 ? (
        <div className="kt-innov-nav">
          {paginas.map((_, p) => (
            <button
              key={p}
              type="button"
              className="kt-innov-punto"
              aria-current={p === pagina}
              aria-label={plantilla(t('productDetail.innovations.goTo', 'Ir a la página {i} de {n}'), { i: p + 1, n: total })}
              onClick={() => irA(p)}
            />
          ))}
          <span className="kt-innov-pag" aria-hidden="true">
            {pagina + 1} / {total}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default InnovacionesGrilla
