import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import InnovacionIcono from './InnovacionIcono'
import { POR_PAGINA, paginar, paginaDesdeScroll, conGuiones } from '../../../shared/utils/innovaciones-grilla'
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
 * posicionado según la ficha abierta: tarjeta con flechita, ícono + título + descripción. En compu va POR
 * ENCIMA de la ficha si hay lugar en la ventana (si no, por debajo), alineado a su borde y sin salirse de la
 * columna ni de la ventana; en celular, a todo el ancho DEBAJO de la fila tocada. Las fichas son <button aria-expanded aria-controls>; Escape cierra.
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

// Globo: ancho máximo en compu, aire entre ficha y globo (lo ocupa la flechita), margen mínimo contra el borde de la
// ventana y distancia mínima de la flecha a las esquinas de la tarjeta.
const GLOBO_ANCHO_MAX = 300
const GLOBO_AIRE = 10
const GLOBO_MARGEN = 8
const GLOBO_FLECHA_MIN = 16
const GLOBO_CIERRE_MS = 120 // al pasar del mouse de la ficha al globo (o al revés) no se cierra: WCAG 1.4.13
const useLayoutSeguro = typeof window === 'undefined' ? useEffect : useLayoutEffect

const plantilla = (texto, vars) => texto.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

function InnovacionesGrilla({ items }) {
  const { t, lang } = useLanguage()
  const compu = useSyncExternalStore(suscribirCompu, esCompu, esCompuServidor)
  const idGlobo = useId()
  const idTexto = `${idGlobo}-texto`
  const cierreRef = useRef(null)
  const raizRef = useRef(null)
  const globoRef = useRef(null)
  const pistaRef = useRef(null)
  const ultimoPuntero = useRef('mouse')
  const ignorarScroll = useRef(false) // el scroll que provoca un foco no debe cerrar el globo recién abierto
  const [abierta, setAbierta] = useState(null) // { i, left, width, flecha, abajo, arriba, espacioArriba, lado } de la ficha con explicación abierta
  const [pagina, setPagina] = useState(0)

  const paginas = useMemo(() => paginar(items), [items])
  const total = paginas.length
  const celu = !compu

  const abrir = useCallback((i, boton) => {
    const raiz = raizRef.current
    if (!raiz) return
    const r = raiz.getBoundingClientRect()
    const b = boton.getBoundingClientRect()
    const enCompu = esCompu()
    // Compu: tarjeta de a lo sumo 300px alineada al borde de la ficha, dentro de la columna Y de la ventana.
    // Celular: el ancho de toda la grilla (más corto de leer).
    const ancho = enCompu ? Math.min(GLOBO_ANCHO_MAX, r.width) : r.width
    let left = 0
    if (enCompu) {
      const ventana = document.documentElement.clientWidth
      const min = Math.max(0, GLOBO_MARGEN - r.left)
      const max = Math.max(min, Math.min(r.width - ancho, ventana - GLOBO_MARGEN - ancho - r.left))
      left = Math.min(Math.max(b.left - r.left, min), max)
    }
    const flecha = Math.min(Math.max(b.left - r.left + b.width / 2 - left, GLOBO_FLECHA_MIN), Math.max(GLOBO_FLECHA_MIN, ancho - GLOBO_FLECHA_MIN))
    // Una cabecera fija tapa lo que queda detrás: el «lugar de arriba» se cuenta desde su borde inferior.
    const cab = document.querySelector('header')
    const tope = cab && /fixed|sticky/.test(getComputedStyle(cab).position) ? Math.max(0, cab.getBoundingClientRect().bottom) : 0
    setAbierta({
      i,
      left,
      width: ancho,
      flecha,
      abajo: b.bottom - r.top + GLOBO_AIRE, // `top` del globo si va debajo de la ficha
      arriba: r.bottom - b.top + GLOBO_AIRE, // `bottom` del globo si va encima
      espacioArriba: b.top - tope - GLOBO_MARGEN,
      lado: enCompu ? null : 'abajo', // compu: se decide al medir el globo (abajo)
    })
  }, [])

  // Compu: ya con el texto puesto se mide el alto real del globo y se elige el lado antes de pintar.
  useLayoutSeguro(() => {
    if (!abierta || abierta.lado) return
    const alto = globoRef.current?.offsetHeight ?? 0
    const lado = abierta.espacioArriba >= alto + GLOBO_AIRE ? 'arriba' : 'abajo'
    setAbierta((a) => (a && a.i === abierta.i && !a.lado ? { ...a, lado } : a))
  }, [abierta])

  const cancelarCierre = useCallback(() => {
    clearTimeout(cierreRef.current)
    cierreRef.current = null
  }, [])
  const programarCierre = useCallback(() => {
    clearTimeout(cierreRef.current)
    cierreRef.current = setTimeout(() => setAbierta(null), GLOBO_CIERRE_MS)
  }, [])
  useEffect(() => () => clearTimeout(cierreRef.current), [])

  // Escape cierra (con el mouse el foco no está en la ficha); tocar afuera también.
  useEffect(() => {
    if (!abierta) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        cancelarCierre()
        setAbierta(null)
      }
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
  }, [abierta, cancelarCierre])

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
    cancelarCierre()
    if (abierta?.i === i) setAbierta(null)
    else abrir(i, boton)
  }

  // El contenido de las innovaciones se carga SIEMPRE en español (aunque la página esté en otro idioma): se silabea
  // siempre y esos elementos llevan lang="es"; la interfaz de alrededor (textos, hint) sigue con el idioma de la página.
  const titulo = conGuiones

  const itemAbierto = abierta ? items[abierta.i] : null
  const textoGlobo = (itemAbierto?.description || '').trim()
  const tituloGlobo = (itemAbierto?.title || '').trim()
  const inicialGlobo = Array.from(tituloGlobo)[0]?.toUpperCase() || '·'
  const estiloGlobo = abierta
    ? {
        left: abierta.left,
        width: abierta.width,
        '--kt-flecha': `${abierta.flecha}px`,
        ...(abierta.lado === 'arriba' ? { bottom: abierta.arriba } : { top: abierta.abajo }),
      }
    : undefined

  return (
    <div ref={raizRef} className="kt-innov kt-reveal-item" lang={lang}>
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
                  <span className="min-w-0" lang="es">
                    {titulo(inn.title)}
                  </span>
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
                  aria-describedby={esta ? idTexto : undefined}
                  onPointerDown={(e) => {
                    ultimoPuntero.current = e.pointerType
                  }}
                  onKeyDown={() => {
                    ultimoPuntero.current = 'teclado'
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'mouse' || !esCompu()) return
                    cancelarCierre()
                    abrir(i, e.currentTarget) // siempre: si la página se desplazó mientras tanto, el lado (arriba/abajo) se vuelve a elegir
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse' && esCompu()) programarCierre()
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
        ref={globoRef}
        id={idGlobo}
        role="tooltip"
        className="kt-innov-globo"
        data-lado={abierta?.lado || undefined}
        hidden={!abierta}
        style={estiloGlobo}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') cancelarCierre()
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && esCompu()) programarCierre()
        }}
        onClick={() => {
          // En táctil el globo tapa la fila de abajo: tocarlo lo cierra. Con mouse sigue abierto (se recorre).
          if (ultimoPuntero.current !== 'mouse' || !esCompu()) setAbierta(null)
        }}
      >
        {abierta ? (
          <>
            <span className="kt-innov-globo-cab">
              {itemAbierto?.image ? (
                <InnovacionIcono src={itemAbierto.image} tamano="kt-innov-globo-icono" relleno="p-1.5" />
              ) : (
                <span className="kt-innov-inicial kt-innov-inicial--grande" aria-hidden="true">
                  {inicialGlobo}
                </span>
              )}
              <span className="kt-innov-globo-titulo" lang="es">
                {titulo(tituloGlobo)}
              </span>
            </span>
            <span id={idTexto} className="kt-innov-globo-texto" lang="es">
              {textoGlobo}
            </span>
          </>
        ) : null}
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
