import { Background } from './Background'
import { ElementView, boxAt } from './elements/ElementView'
import { useCarousel } from './useCarousel'

const shadowOf = (s) =>
  ({ none: 'none', sm: '0 1px 4px rgba(0,0,0,.2)', md: '0 6px 20px rgba(0,0,0,.3)', lg: '0 12px 40px rgba(0,0,0,.45)' }[s])

function SlideView({ slide, bp, visible }) {
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: visible ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: visible ? 'auto' : 'none' }} data-slide>
      <Background bg={slide.background} />
      {slide.overlay > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${slide.overlay})` }} />}
      {(Array.isArray(slide.elements) ? [...slide.elements] : []).sort((a, b) => a.z - b.z).map((el) => {
        const box = boxAt(el, bp)
        return (
          <div key={el.id} data-el data-id={el.id}
            style={{ position: 'absolute', left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: el.z }}>
            <ElementView el={el} bp={bp} />
          </div>
        )
      })}
    </div>
  )
}

const DEFAULT_THEME = { colors: { bg: '#111111' }, radius: 12, shadow: 'md', fontFamily: 'Inter, sans-serif' }
const DEFAULT_SETTINGS = { autoplay: true, intervalMs: 6000, loop: true, arrows: false, dots: true, fullHeight: true, heightDesktop: '100vh', heightMobile: '100svh' }

export function CarouselRenderer({ config, breakpoint, activeIndex, containerHeight, bleed }) {
  const settings = config?.settings ?? DEFAULT_SETTINGS
  const slides = Array.isArray(config?.slides) ? config.slides : []
  const theme = config?.theme ?? DEFAULT_THEME
  const auto = useCarousel({ count: slides.length, autoplay: settings.autoplay && activeIndex === undefined, intervalMs: settings.intervalMs, loop: settings.loop })
  const index = activeIndex ?? auto.index
  // containerHeight (opcional) permite al consumidor fijar la altura (ej. kolortec:
  // viewport menos navbar, ajustado por la escala del canvas). bleed = full-bleed
  // (sin esquinas ni sombra). Ambos son opcionales → store/admin no cambian.
  const height = containerHeight ?? (settings.fullHeight ? '100vh' : (breakpoint === 'mobile' ? settings.heightMobile : settings.heightDesktop))
  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: bleed ? 0 : theme.radius, boxShadow: bleed ? 'none' : shadowOf(theme.shadow), fontFamily: theme.fontFamily, background: theme.colors.bg, containerType: 'inline-size' }}>
      {config.background && config.background.type !== 'none' && (
        <div style={{ position: 'absolute', inset: 0 }}><Background bg={config.background} /></div>
      )}
      {slides.map((s, i) => <SlideView key={s.id} slide={s} bp={breakpoint} visible={i === index} />)}
      {settings.arrows && slides.length > 1 && (
        <>
          <button aria-label="anterior" onClick={auto.prev} style={arrow('left')}>&#8249;</button>
          <button aria-label="siguiente" onClick={auto.next} style={arrow('right')}>&#8250;</button>
        </>
      )}
      {settings.dots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {slides.map((s, i) => <span key={s.id} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? '#fff' : 'rgba(255,255,255,.5)' }} />)}
        </div>
      )}
    </div>
  )
}

const arrow = (side) => ({
  position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,.3)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18,
})
