import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import InnovacionIcono from './InnovacionIcono'
import { POR_PAGINA, paginar, paginaDesdeScroll, conGuiones, primeraConDescripcion, tieneDescripcion } from '../../../shared/utils/innovaciones-grilla'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * InnovacionesGrilla — las innovaciones de la ficha cuando son MUCHAS (5 o más; hasta 4 va la lista de
 * siempre, la decide ProductDetailPage con usaGrilla). Mockup docs/diseno/mockups/2026-10-21-innovaciones-imagen,
 * opción C1 «Panel de detalle ARRIBA» (elegida por Fedev, 21-oct-2026); reemplaza al globo flotante.
 *
 * Un solo DOM, dos presentaciones por CSS (.kt-innov-* en index.css, corte en 768px como el resto del repo):
 *   · compu (≥768px): un recuadro de detalle FIJO arriba y debajo la grilla de fichas (imagen + nombre).
 *   · celular: el mismo recuadro arriba y las fichas en páginas de 6 (2×3) con scroll-snap horizontal nativo;
 *     puntos + «1 / N» sincronizados con el scroll.
 *
 * Qué muestra el recuadro: la ficha SEÑALADA. Mouse: la que está debajo del puntero (queda la última si el
 * puntero se va). Teclado: la que tiene el foco. Celular: la que se toca. Al cargar, la primera con descripción.
 * Celular: al cambiar de página del carrusel se señala la primera con descripción de la página nueva (salvo que la
 * señalada ya esté en ella, p. ej. el foco llevó la pista hasta su ficha), así el recuadro nunca muestra una que no
 * está a la vista.
 * Accesibilidad: las fichas son <button> con aria-current="true" la señalada y aria-controls hacia el recuadro; su
 * nombre accesible es el título. El recuadro es role=region con aria-label y SIN aria-live: una región viva anunciaba
 * cada ficha que cruzaba el mouse y, con teclado, repetía lo que ya anuncia el foco (joan REG-004 / ra VIS-002).
 * Una innovación sin descripción no tiene nada que mostrar en el recuadro: es una ficha sin botón. Si NINGUNA tiene
 * descripción no hay recuadro, y el texto de ayuda sólo cuenta («N innovaciones»), sin prometer un detalle.
 *
 * ALTO ESTABLE: el recuadro mide siempre lo que mide la descripción MÁS LARGA de todas. Eso se logra con una
 * capa invisible (aria-hidden, visibility: hidden) que apila en la misma celda de grilla el contenido de todas
 * las innovaciones: el alto lo da la más alta y no depende de cuál esté señalada, así que cambiar de ficha
 * nunca mueve la grilla debajo del puntero. Además hay un piso (--innov-detalle-alto en index.css).
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

// El contenido de las innovaciones se carga SIEMPRE en español (aunque la página esté en otro idioma): se silabea
// siempre y esos elementos llevan lang="es"; la interfaz de alrededor (textos, hint) sigue con el idioma de la página.
const titulo = conGuiones
const inicialDe = (texto) => Array.from((texto || '').trim())[0]?.toUpperCase() || '·'

/** Imagen (o la inicial, si no hay imagen) de una innovación, en el tamaño de su clase (ficha o detalle). */
function Imagen({ item, clase }) {
  // Imagen rota (404, red): cae a la inicial, igual que sin imagen. Se guarda CUÁL falló, así un cambio de imagen reintenta.
  const [rota, setRota] = useState(null)
  if (item.image && rota !== item.image) {
    return <InnovacionIcono src={item.image} tamano={clase} relleno="" cuadrado onError={() => setRota(item.image)} />
  }
  return (
    <span className={`kt-innov-inicial ${clase}`} aria-hidden="true">
      {inicialDe(item.title)}
    </span>
  )
}

/** Contenido del recuadro. `medida`: la copia invisible que sólo da alto (sin imagen real, con un hueco del mismo tamaño). */
function DetalleContenido({ item, medida = false }) {
  return (
    <div className="kt-innov-detalle-item">
      {medida ? <span className="kt-innov-detalle-img" /> : <Imagen item={item} clase="kt-innov-detalle-img" />}
      <div className="kt-innov-detalle-cuerpo">
        <span className="kt-innov-detalle-titulo" lang="es">
          {titulo((item.title || '').trim())}
        </span>
        <span className="kt-innov-detalle-texto" lang="es">
          {(item.description || '').trim()}
        </span>
      </div>
    </div>
  )
}

function InnovacionesGrilla({ items, arriba: arribaProp }) {
  const { t, lang } = useLanguage()
  const compu = useSyncExternalStore(suscribirCompu, esCompu, esCompuServidor)
  const pistaRef = useRef(null)
  const raizRef = useRef(null)
  const ultimoPuntero = useRef({ x: -1, y: -1 })
  const idDetalle = useId()
  const [pagina, setPagina] = useState(0)

  const paginas = useMemo(() => paginar(items), [items])
  const total = paginas.length
  const celu = !compu

  // Señalada: al cargar (y si cambia el producto) la primera con descripción. La lista se identifica por sus títulos y no por
  // la referencia del array, que puede cambiar entre renders sin que cambie el producto.
  const firma = useMemo(() => items.map((it) => it.title).join('\u0001'), [items])
  const primera = useMemo(() => primeraConDescripcion(items), [items])
  const [eleccion, setEleccion] = useState({ firma, i: primera })
  const sel = eleccion.firma === firma ? eleccion.i : primera
  const senalar = useCallback((i) => setEleccion((e) => (e.firma === firma && e.i === i ? e : { firma, i })), [firma])
  const itemSel = sel >= 0 ? items[sel] : null

  // Al llegar a una página nueva (celular) se señala su primera ficha con descripción, salvo que la señalada ya sea de
  // esa página. Una página sin ninguna con descripción deja la señalada como está (no hay otra que mostrar).
  const alPaginar = useCallback(
    (n) =>
      setEleccion((e) => {
        const actual = e.firma === firma ? e.i : primera
        if (actual >= 0 && Math.floor(actual / POR_PAGINA) === n) return e
        const k = paginas[n]?.findIndex(tieneDescripcion) ?? -1
        return k < 0 ? e : { firma, i: n * POR_PAGINA + k }
      }),
    [firma, primera, paginas],
  )

  // Compu: el recuadro se CLAVA arriba (position: sticky) sólo cuando hace falta: si la grilla más el recuadro no entran
  // en el alto de la ventana (menos lo que ocupan las barras fijas, --kt-detail-top). Si entran —1440 con 9 innovaciones—,
  // no se clava y no hay espacio de apoyo: queda en flujo normal. `clavable` pone la clase kt-innov--clavable, de la que
  // cuelga todo el CSS del sticky. Para que una ficha enfocada con el teclado no quede escondida DEBAJO del recuadro
  // clavado, además se publica su alto real como --innov-detalle-h (las fichas lo suman a su scroll-margin-top).
  const [clavable, setClavable] = useState(false)
  const hayDetalle = Boolean(itemSel)
  useEffect(() => {
    const raiz = raizRef.current
    const caja = raiz?.querySelector('.kt-innov-detalle')
    if (!raiz || !caja || typeof ResizeObserver === 'undefined') return undefined
    // Alto de LAYOUT (no getBoundingClientRect: no lo afecta ningún transform) redondeado HACIA ARRIBA: el recuadro mide
    // 192,6 y publicar 192 dejaba asomar el borde de la última ficha (ra VIS-015). El ResizeObserver no avisa de los
    // cambios de menos de 1px (la fuente web que llega después), así que también se vuelve a medir con las fuentes.
    const poner = () => {
      const alto = Math.ceil(parseFloat(getComputedStyle(caja).height) || 0)
      raiz.style.setProperty('--innov-detalle-h', `${alto}px`)
      // La grilla se mide SIN el espacio de apoyo (su padding-bottom), que sólo existe cuando ya es clavable: si no, al
      // clavarse crecería y dejaría de entrar, y la clase titilaría.
      const pista = pistaRef.current
      const grilla = pista ? pista.offsetHeight - (parseFloat(getComputedStyle(pista).paddingBottom) || 0) : 0
      // `arribaProp`: dónde se clava el recuadro (navbar + barra de secciones + 12), que ProductDetailPage mide y cambia
      // cuando aparece la barra de la ficha: se vuelve a calcular cuando cambia (ra VIS-019); sin él se lee la variable CSS.
      const arriba = arribaProp || parseFloat(getComputedStyle(raiz).getPropertyValue('--kt-detail-top')) || 132
      setClavable(alto + 12 + grilla > window.innerHeight - arriba)
    }
    poner()
    const ro = new ResizeObserver(poner)
    ro.observe(caja)
    if (pistaRef.current) ro.observe(pistaRef.current)
    document.fonts?.ready.then(poner)
    window.addEventListener('load', poner)
    window.addEventListener('resize', poner)
    return () => {
      ro.disconnect()
      window.removeEventListener('load', poner)
      window.removeEventListener('resize', poner)
    }
  }, [hayDetalle, items, arribaProp])

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
    if (celu && nueva !== pagina) alPaginar(nueva)
  }

  const irA = (n, instantaneo = false) => {
    const pista = pistaRef.current
    if (!pista) return
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pista.scrollTo({ left: pista.children[n].offsetLeft - pista.children[0].offsetLeft, behavior: reducido || instantaneo ? 'auto' : 'smooth' })
  }

  return (
    <div ref={raizRef} className={`kt-innov kt-reveal-item${clavable ? ' kt-innov--clavable' : ''}`} lang={lang}>
      <p className="kt-innov-hint">
        {itemSel ? (
          <>
            <span className="kt-innov-hint-mouse">
              {plantilla(t('productDetail.innovations.hintMouse', '{n} innovaciones · pasá el mouse para ver el detalle'), { n: items.length })}
            </span>
            <span className="kt-innov-hint-tap">
              {plantilla(t('productDetail.innovations.hintTap', '{n} innovaciones · tocá una para ver el detalle'), { n: items.length })}
            </span>
            <span className="kt-innov-hint-tactil">
              {plantilla(t('productDetail.innovations.hintTouch', '{n} innovaciones · deslizá para ver más · tocá una para ver el detalle'), { n: items.length })}
            </span>
          </>
        ) : celu && total > 1 ? (
          // Sin ninguna descripción no hay detalle que ver: sólo se cuenta (y, si el carrusel tiene más páginas, se invita a deslizar).
          plantilla(t('productDetail.innovations.hintSwipe', '{n} innovaciones · deslizá para ver más'), { n: items.length })
        ) : (
          plantilla(t('productDetail.innovations.hintCount', '{n} innovaciones'), { n: items.length })
        )}
      </p>

      {itemSel ? (
        <div
          id={idDetalle}
          className="kt-innov-detalle"
          role="region"
          aria-label={t('productDetail.innovations.detail', 'Detalle de la innovación')}
        >
          <DetalleContenido item={itemSel} />
          <div className="kt-innov-detalle-medida" aria-hidden="true">
            {items.filter(tieneDescripcion).map((it, k) => (
              <DetalleContenido key={k} item={it} medida />
            ))}
          </div>
        </div>
      ) : null}

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
              const contenido = (
                <>
                  <Imagen item={inn} clase="kt-innov-img" />
                  <span className="kt-innov-nombre min-w-0" lang="es">
                    {titulo(inn.title)}
                  </span>
                </>
              )
              // Una descripción de sólo espacios es no tener descripción: no hay nada que señalar.
              if (!tieneDescripcion(inn)) {
                return (
                  <div key={i} className="kt-innov-ficha">
                    {contenido}
                  </div>
                )
              }
              return (
                <button
                  key={i}
                  type="button"
                  className="kt-innov-ficha"
                  aria-current={sel === i ? 'true' : undefined}
                  aria-controls={idDetalle}
                  onPointerMove={(e) => {
                    // Se señala por MOVIMIENTO del puntero, no porque la ficha pase por debajo de él: con el puntero quieto,
                    // la rueda desliza la página y el navegador reenvía eventos en las mismas coordenadas; esos se ignoran
                    // (ra VIS-016).
                    if (e.pointerType !== 'mouse' || !esCompu()) return
                    const u = ultimoPuntero.current
                    if (u.x === e.clientX && u.y === e.clientY) return
                    ultimoPuntero.current = { x: e.clientX, y: e.clientY }
                    senalar(i)
                  }}
                  onFocus={(e) => {
                    senalar(i)
                    if (e.currentTarget.matches(':focus-visible') && !esCompu()) {
                      // Chrome no desplaza una ficha que asoma a medias (el borde de la página siguiente): el foco
                      // quedaría casi fuera de pantalla. Se lleva la pista a su página.
                      const p2 = Math.floor(i / POR_PAGINA)
                      if (p2 !== pagina) irA(p2, true)
                    }
                  }}
                  onClick={() => senalar(i)}
                >
                  {contenido}
                </button>
              )
            })}
          </div>
        ))}
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
