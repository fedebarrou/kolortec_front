import { useCallback } from 'react'
import { Background } from './Background'
import { ElementView, boxAt } from './elements/ElementView'
import { useCarousel } from './useCarousel'
import { ScrollScrim } from './ScrollRenderer'
import { SIZE_COMPAT_DEFAULTS } from './scroll-contract'

const shadowOf = (s) =>
  ({ none: 'none', sm: '0 1px 4px rgba(0,0,0,.2)', md: '0 6px 20px rgba(0,0,0,.3)', lg: '0 12px 40px rgba(0,0,0,.45)' }[s])

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

function SlideView({ slide, bp, visible, slideIndex, activeIndex, isSlide, accentColor }) {
  return (
    <div style={slideStyle(visible, slideIndex, activeIndex, isSlide)} data-slide>
      <Background bg={slide.background} />
      {/* Scrim de escena: el mismo campo `slide.scrim` del modo scroll. Antes
          el carrusel lo IGNORABA, asi que una escena con scrim se veia sin el.
          Va despues del fondo y antes de los elementos, igual que en ScrollStage. */}
      {slide.scrim && slide.scrim !== "none" ? <ScrollScrim breakpoint={bp} variant={slide.scrim} /> : null}
      {slide.overlay > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${slide.overlay})` }} />}
      {[...slide.elements].sort((a, b) => a.z - b.z).map((el) => {
        const box = boxAt(el, bp)
        return (
          <div key={el.id} data-el data-id={el.id}
            style={{ position: 'absolute', left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: el.z }}>
            <ElementView el={el} bp={bp} accentColor={accentColor} />
          </div>
        )
      })}
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const durationForIndex = useCallback((i) => {
    const id = slides[i]?.id
    const own = id ? settings.slideDurations?.[id] : undefined
    return typeof own === 'number' && own > 0 ? own : null
  }, [idsKey, durKey])
  const auto = useCarousel({ count: slides.length, autoplay: settings.autoplay && activeIndex === undefined, intervalMs: settings.intervalMs, loop: settings.loop, durationForIndex })
  const index = activeIndex ?? auto.index
  // containerHeight/bleed opcionales (sync con store/kolortec). bleed = full-bleed
  // (sin radio ni sombra) para que el preview coincida con el hero publicado.
  // Claves de tamaño ausentes → SIZE_COMPAT_DEFAULTS (`??` para no pisar un
  // fullHeight:false explícito). Un diseño sin ellas rendereaba `height:
  // undefined` acá mientras el admin lo mostraba full — ver scroll-contract.js.
  const fullHeight = settings.fullHeight ?? SIZE_COMPAT_DEFAULTS.fullHeight
  const heightDesktop = settings.heightDesktop ?? SIZE_COMPAT_DEFAULTS.heightDesktop
  const heightMobile = settings.heightMobile ?? SIZE_COMPAT_DEFAULTS.heightMobile
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
        ? (settings.aspectMobile ?? SIZE_COMPAT_DEFAULTS.aspectMobile)
        : (settings.aspectDesktop ?? SIZE_COMPAT_DEFAULTS.aspectDesktop))
    : null
  const usaAspecto = !!aspecto && containerHeight == null
  // Parentesis obligatorios: `??` liga mas fuerte que `?:`, sin ellos
  // `containerHeight ?? usaAspecto ? a : b` se evalua como `(containerHeight ?? usaAspecto) ? a : b`
  // y un containerHeight presente daria undefined (hero sin alto).
  const height = containerHeight ?? (usaAspecto ? undefined : (fullHeight ? 'var(--vh-full, 100vh)' : (breakpoint === 'mobile' ? heightMobile : heightDesktop)))
  const radius = contained ? theme.radius : (bleed ? 0 : theme.radius)
  const shadow = contained ? shadowOf(theme.shadow) : (bleed ? 'none' : shadowOf(theme.shadow))
  const isSlide = settings.transition === 'slide'
  const accent = theme.colors?.accent || '#fff'
  // containerName 'hc-stage': SIN el nombre, las reglas `@container hc-stage`
  // (hero-anim.css) no matchean y el widget `message` preset kolortec cae al
  // layout mobile (centrado abajo) en vez del desktop (derecha, centrado).
  // Faltaba en las 3 copias del renderer, no solo acá.
  return (
    <div style={{ position: 'relative', width: contained ? 'calc(100% - var(--hero-gutter, 1.5rem) * 2)' : '100%', maxWidth: contained ? 'var(--hero-maxw, none)' : undefined, marginInline: contained ? 'auto' : undefined, height, aspectRatio: usaAspecto ? aspecto : undefined, overflow: 'hidden', borderRadius: radius, boxShadow: shadow, fontFamily: theme.fontFamily || 'var(--site-font, Inter, sans-serif)', background: theme.colors.bg, containerType: 'inline-size', containerName: 'hc-stage' }}>
      {config.background && config.background.type !== 'none' && (
        <div style={{ position: 'absolute', inset: 0 }}><Background bg={config.background} /></div>
      )}
      {slides.map((s, i) => <SlideView key={s.id} slide={s} bp={breakpoint} visible={i === index} slideIndex={i} activeIndex={index} isSlide={isSlide} accentColor={theme.colors?.primary} />)}
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
