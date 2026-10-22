import { useCallback, useLayoutEffect, useRef } from 'react'
import { Background } from './Background'
import { cssAspect, cssColor, cssFontFamily, cssLength, cssNumber, cssPick } from './cssSafe'
import { ElementView, boxAt } from './elements/ElementView'
import { useCarousel } from './useCarousel'
import { estiloCapaEscena, partirCapas, zIndexCapa } from './layers'
import { ScrollScrim } from './ScrollRenderer'
import { SIZE_COMPAT_DEFAULTS, heroPantallaCompletaElegida } from './scroll-contract'

const shadowOf = (s) =>
  cssPick({ none: 'none', sm: '0 1px 4px rgba(0,0,0,.2)', md: '0 6px 20px rgba(0,0,0,.3)', lg: '0 12px 40px rgba(0,0,0,.45)' }, s)

function slideStyle(visible, i, activeIndex, isSlide) {
  if (!isSlide) {
    // fade: comportamiento original
    return { position: 'absolute', inset: 0, zIndex: 0, opacity: visible ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: visible ? 'auto' : 'none' }
  }
  // slide: desplazamiento horizontal
  // Clamp a ±100%: en el wrap del loop (último→primero) el slide saliente se
  // desplaza UNA pantalla (no N) mientras se desvanece — sin salto visible.
  const offset = Math.max(-100, Math.min(100, (i - activeIndex) * 100))
  return {
    position: 'absolute', inset: 0, zIndex: 0,
    opacity: visible ? 1 : 0,
    transform: `translateX(${offset}%)`,
    transition: 'transform .45s ease, opacity .45s ease',
    pointerEvents: visible ? 'auto' : 'none',
  }
}

// VIS-007 · «si lo elegiste se ve eso; si no elegiste nada se ve como ya está publicado»: sólo un elemento con `animation` (una entrada elegida) repite
// su entrada al activarse la escena. Uno SIN `animation` caía en el fade de 500 ms por defecto y, al remontarse, parpadeaba en cada pasada; en HEAD
// no se veía en las escenas 2..N y el Lab tampoco lo muestra. Los `media` tampoco se remontan (arrancarían de cero).
// Un solo predicado (VIS-012): «el elemento tiene una animación ELEGIDA» = `animation` es un objeto. Lo usan el remontaje y el reinicio de los media.
const tieneAnimacion = (e) => typeof e.animation === 'object' && !!e.animation
const repiteEntrada = (el) => el.type !== 'media' && tieneAnimacion(el)

function SlideView({ slide, bp, visible, slideIndex, activeIndex, isSlide, accentColor }) {
  // Todas las escenas están montadas desde el principio, así que la animación de entrada de las escenas 2..N corría al montar (con la
  // escena invisible) y al activarse ya había terminado: CSS no reinicia una animación que no cambia. Cada vez que la escena PASA a
  // visible se renueva `gen` y con él la key de sus elementos → se remontan y la entrada corre de nuevo (igual que `replayNonce` en
  // el lienzo del editor). Al dejar de ser visible NO se remonta: la escena saliente se desvanece sin repetir su entrada.
  const gen = useRef(0)
  const estabaVisible = useRef(visible)
  if (visible && !estabaVisible.current) gen.current += 1
  estabaVisible.current = visible
  // Los `media` (video) NO se remontan al reactivar la escena: arrancarían de cero. Se les reinicia sólo la animación de entrada.
  const caja = useRef(null)
  const reactivada = gen.current
  useLayoutEffect(() => {
    const raiz = caja.current
    if (reactivada === 0 || !raiz || typeof raiz.getAnimations !== 'function') return
    const idsMedia = new Set(slide.elements.filter((e) => e.type === 'media' && tieneAnimacion(e)).map((e) => e.id))
    for (const nodo of raiz.querySelectorAll('[data-el]')) {
      if (!idsMedia.has(nodo.getAttribute('data-id'))) continue
      for (const a of nodo.getAnimations({ subtree: true })) { a.cancel(); a.play() }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactivada])
  // Orden de capas (./layers.js): fondo de escena -> elementos de FONDO (z <= 0,
  // la foto como elemento `media`) -> scrim -> overlay -> elementos de CONTENIDO
  // (z >= 1). La oscuridad va arriba de la foto y abajo del texto. zIndex explicitos.
  const { fondo, contenido } = partirCapas(slide.elements)
  const pintar = (el) => {
    const box = boxAt(el, bp)
    return (
      <div key={repiteEntrada(el) ? `${el.id}:${gen.current}` : el.id} data-el data-id={el.id}
        style={{ position: 'absolute', left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: zIndexCapa(el) }}>
        <ElementView el={el} bp={bp} accentColor={accentColor} active={visible} />
      </div>
    )
  }
  return (
    <div ref={caja} style={slideStyle(visible, slideIndex, activeIndex, isSlide)} data-slide>
      <Background bg={slide.background} />
      {fondo.map(pintar)}
      {/* Scrim de escena: el mismo campo `slide.scrim` del modo scroll. Antes
          el carrusel lo IGNORABA, asi que una escena con scrim se veia sin el.
          Va arriba de los elementos de fondo y debajo del contenido. Ni el scrim
          ni el overlay capturan el mouse: si no, taparian un elemento de fondo
          (seleccionarlo, arrastrarlo, clickearlo). */}
      {slide.scrim && slide.scrim !== 'none' ? <ScrollScrim breakpoint={bp} variant={slide.scrim} style={estiloCapaEscena()} /> : null}
      {slide.overlay > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${cssNumber(slide.overlay)})`, ...estiloCapaEscena(true) }} />}
      {contenido.map(pintar)}
    </div>
  )
}

export function CarouselRenderer({ config, breakpoint, activeIndex, containerHeight, bleed, fillWidth }) {
  const { settings, slides, theme } = config
  // Duración de autoplay por-slide (settings.slideDurations[slideId], ms) — sin
  // valor propio cae a settings.intervalMs. Memoizado por firma de contenido (no
  // por referencia de `slides`/`slideDurations`, que puede recrearse en cada
  // render del caller) para no reiniciar el timer de useCarousel sin necesidad.
  const idsKey = slides.map((s) => s.id).join('|')
  const durKey = JSON.stringify(settings.slideDurations || {})
  const durationForIndex = useCallback((i) => {
    const id = slides[i]?.id
    const own = id ? settings.slideDurations?.[id] : undefined
    return typeof own === 'number' && own > 0 ? own : null
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps por firma de contenido (idsKey/durKey) a propósito: ver comentario de arriba; con slides/slideDurations por referencia se reiniciaría el timer en cada render del caller
  }, [idsKey, durKey])
  const auto = useCarousel({ count: slides.length, autoplay: settings.autoplay && activeIndex === undefined, intervalMs: settings.intervalMs, loop: settings.loop, durationForIndex })
  const index = activeIndex ?? auto.index
  // containerHeight/bleed opcionales (sync con store/kolortec). bleed = full-bleed
  // (sin radio ni sombra) para que el preview coincida con el hero publicado.
  // Claves de tamaño ausentes → SIZE_COMPAT_DEFAULTS (`??` para no pisar un
  // fullHeight:false explícito). Un diseño sin ellas rendereaba `height:
  // undefined` acá mientras el admin lo mostraba full — ver scroll-contract.js.
  const fullHeight = settings.fullHeight ?? SIZE_COMPAT_DEFAULTS.fullHeight
  const heightDesktop = cssLength(settings.heightDesktop ?? SIZE_COMPAT_DEFAULTS.heightDesktop)
  const heightMobile = cssLength(settings.heightMobile ?? SIZE_COMPAT_DEFAULTS.heightMobile)
  // MODO CONTENEDOR: el hero deja de ser full-bleed y respeta los márgenes
  // laterales de la página, como el `.hero--contained` del renderer legacy.
  // El ancho lo declara CADA SITIO con `--hero-gutter` / `--hero-maxw`, para que
  // el hero quede alineado con SUS secciones. No se puede hardcodear: la store
  // capea en su container (1200 - 2x gutter = 1136) y kolortec NO capea (su
  // .kt-container es full width con padding-inline 1.5rem / 10rem >=1024px).
  // Antes iba el numero de la store, y en kolortec el hero salia mucho mas
  // angosto que las secciones de al lado. (`--content-max` lo
  // setea Apariencia, `--container-maxw` es el default del sitio, 1200px es el
  // fallback para el admin, donde esas vars no existen). Lo que distingue a este
  // modo del full NO es un ancho más chico: es respetar los márgenes de la web
  // y usar un alto de encabezado (la mitad).
  // El gutter va en el width (no como padding) para que sea margen EXTERIOR.
  // `fillWidth`: las miniaturas del editor ignoran el modo contenedor — ahí el
  // recuadro chico YA es el encuadre y un gutter de 24px se comería la miniatura.
  // La regla es la MISMA que heroSizeMode() del Inspector (contenedor salvo que
  // las DOS claves sean full), si no el selector diría una cosa y esto otra.
  const heroWidth = settings.heroWidth ?? SIZE_COMPAT_DEFAULTS.heroWidth
  const contained = !fillWidth && !(fullHeight && heroWidth === 'full')
  // RELACION DE ASPECTO (modo Encabezado): con una relacion puesta el alto sale
  // del ancho, que a su vez es el del contenido de las secciones. Sin relacion
  // (diseno viejo) se cae al alto en px de siempre. `containerHeight` sigue
  // ganando: si el host fuerza un alto, no hay aspecto que valga.
  const aspecto = contained
    ? (breakpoint === 'mobile'
        ? cssAspect(settings.aspectMobile ?? SIZE_COMPAT_DEFAULTS.aspectMobile)
        : cssAspect(settings.aspectDesktop ?? SIZE_COMPAT_DEFAULTS.aspectDesktop))
    : null
  const usaAspecto = !!aspecto && containerHeight == null
  // Parentesis obligatorios: `??` liga mas fuerte que `?:`, sin ellos
  // `containerHeight ?? usaAspecto ? a : b` se evalua como `(containerHeight ?? usaAspecto) ? a : b`
  // y un containerHeight presente daria undefined (hero sin alto).
  // REG-003 · un `heightMobile` ELEGIDO se ve en el celular aunque el diseño no tenga fullHeight/heroWidth (el modo «completo» es sólo el compat): sólo una
  // «Pantalla completa» elegida (las dos claves explícitas) gana sobre él.
  const alturaMovilElegida = breakpoint === 'mobile' && Number.isFinite(settings.heightMobile) && !heroPantallaCompletaElegida(settings)
  const height = containerHeight ?? (usaAspecto ? undefined : ((fullHeight && !alturaMovilElegida) ? 'var(--vh-full, 100vh)' : (breakpoint === 'mobile' ? heightMobile : heightDesktop)))
  const radius = contained ? cssLength(theme.radius) : (bleed ? 0 : cssLength(theme.radius))
  const shadow = contained ? shadowOf(theme.shadow) : (bleed ? 'none' : shadowOf(theme.shadow))
  const isSlide = settings.transition === 'slide'
  const accent = cssColor(theme.colors?.accent, '#fff')
  // containerName 'hc-stage': SIN el nombre, las reglas `@container hc-stage`
  // (hero-anim.css) no matchean y el widget `message` preset kolortec cae al
  // layout mobile (centrado abajo) en vez del desktop (derecha, centrado).
  // Faltaba en las 3 copias del renderer, no solo acá.
  return (
    <div style={{ position: 'relative', width: contained ? 'calc(100% - var(--hero-gutter, 1.5rem) * 2)' : '100%', maxWidth: contained ? 'var(--hero-maxw, none)' : undefined, marginInline: contained ? 'auto' : undefined, height, aspectRatio: usaAspecto ? aspecto : undefined, overflow: 'hidden', borderRadius: radius, boxShadow: shadow, fontFamily: cssFontFamily(theme.fontFamily, 'var(--site-font, Inter, sans-serif)'), background: cssColor(theme.colors.bg), color: cssColor(theme.colors?.text, '#ffffff'), containerType: 'inline-size', containerName: 'hc-stage' }}>
      {config.background && config.background.type !== 'none' && (
        <div style={{ position: 'absolute', inset: 0 }}><Background bg={config.background} /></div>
      )}
      {slides.map((s, i) => <SlideView key={s.id} slide={s} bp={breakpoint} visible={i === index} slideIndex={i} activeIndex={index} isSlide={isSlide} accentColor={cssColor(theme.colors?.primary)} />)}
      {settings.arrows && slides.length > 1 && (
        <>
          <button aria-label="anterior" onClick={auto.prev} style={arrow('left', accent)}>&#8249;</button>
          <button aria-label="siguiente" onClick={auto.next} style={arrow('right', accent)}>&#8250;</button>
        </>
      )}
      {settings.dots && slides.length > 1 && (
        <div role="tablist" aria-label="slides del carrusel" style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
          {slides.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`Ir al slide ${i + 1}`}
              onClick={() => auto.go(i)}
              style={{ appearance: 'none', WebkitAppearance: 'none', width: i === index ? 16 : 6, height: 6, padding: 0, margin: 0, border: 'none', borderRadius: 3, background: i === index ? accent : 'rgba(255,255,255,.5)', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  )
}

const arrow = (side, accent) => ({
  // zIndex: las flechas son chrome y van SIEMPRE arriba del contenido. Sin esto
  // quedaban debajo: los elementos de una escena nacen con z:1 y, como el slide
  // en modo fade no creaba contexto de apilado, ese z competia aca afuera y se
  // comia los clicks. Se arreglo por los dos lados (ver slideStyle).
  position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)', zIndex: 5,
  background: 'rgba(0,0,0,.3)', color: accent, border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18,
})
