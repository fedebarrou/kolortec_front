import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useHeroExitZoom } from '../../../shared/hooks/useHeroExitZoom'
import { useHeroTranslation } from '../../../shared/services/useHeroTranslation'
import { CarouselRenderer } from '../_hero-renderer/CarouselRenderer'
import { heroSizeMode } from '../_hero-renderer/scroll-contract'

// Detect breakpoint once per mount (matchMedia — not reactive to resize, good enough for hero).
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    if (window.matchMedia('(max-width: 767px)').matches) return 'mobile'
    if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet'
    return 'desktop'
  })
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const mql2 = window.matchMedia('(max-width: 1023px)')
    const update = () => {
      if (mql.matches) setBp('mobile')
      else if (mql2.matches) setBp('tablet')
      else setBp('desktop')
    }
    mql.addEventListener('change', update)
    mql2.addEventListener('change', update)
    return () => { mql.removeEventListener('change', update); mql2.removeEventListener('change', update) }
  }, [])
  return bp
}

// Default settings fallback so CarouselRenderer never receives settings=null.
const DEFAULT_SETTINGS = {
  autoplay: true,
  intervalMs: 7000,
  loop: true,
  arrows: false,
  dots: true,
  fullHeight: true,
  heightDesktop: '100vh',
  heightMobile: '100svh',
}

function HeroSection({ hero }) {
  const { t } = useLanguage()
  const bp = useBreakpoint()

  // IMPORTANTE: todos los hooks se declaran ANTES de cualquier return condicional.
  // El hero puede empezar como legacy (defaults) y pasar a lab (labConfig) tras el
  // fetch; si el early-return del path lab quedara antes de estos hooks, React
  // lanzaría "Rendered fewer hooks than expected" y tumbaría toda la landing.
  const slides = hero?.slides ?? (hero ? [hero] : [])
  const intervalMs = hero?.intervalMs ?? 7000
  const [activeIndex, setActiveIndex] = useState(0)
  const isPausedRef = useRef(false)

  // El path lab usa su propio carrusel (CarouselRenderer/useCarousel); este intervalo
  // sólo aplica al hero legacy. Se corta solo cuando hay labConfig o <=1 slide.
  const isLab = !!hero?.labConfig
  // Traducción al vuelo de los textos del carrusel. ANTES el Encabezado no se
  // traducía en absoluto: el diseño se edita en castellano en el admin y salía
  // así aunque el sitio estuviera en inglés. Mismo camino que el scrolltelling.
  // Va acá arriba por la regla de hooks del comentario de más arriba.
  const labConfigTranslated = useHeroTranslation(hero?.labConfig)

  // Escalado del hero al salir de pantalla (ver useHeroExitZoom). El ref se
  // engancha sólo en el camino lab —que es el que renderiza kolortec— pero el
  // hook se declara acá arriba por la regla de hooks del comentario de más
  // arriba: no puede quedar después del return condicional. `isLab` es la
  // bandera que rearma el efecto cuando el hero por fin se monta: en el primer
  // render todavía no llegó el contenido y el ref está vacío.
  const heroRef = useRef(null)
  useHeroExitZoom(heroRef, isLab)

  useEffect(() => {
    if (isLab || slides.length <= 1) return undefined

    const id = window.setInterval(() => {
      if (isPausedRef.current) return
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [isLab, slides.length, intervalMs, activeIndex])

  // Lab path: render with CarouselRenderer when the backend emits lab elements.
  if (hero?.labConfig) {
    const config = {
      ...labConfigTranslated,
      settings: hero.labConfig.settings ?? DEFAULT_SETTINGS,
    }
    // Alto SÓLO en modo Pantalla completa. `containerHeight` le gana al alto del
    // diseño dentro del CarouselRenderer, así que pasarlo siempre hacía que el
    // modo Encabezado (alto fijo 280/320) NUNCA se viera acá: el hero salía a
    // pantalla completa aunque el diseño dijera otra cosa — y el ancho/el radio
    // sí se aplicaban, lo que confundía más ("respeta unas cosas y otras no").
    // En modo Encabezado va `undefined` y manda settings.heightDesktop/Mobile.
    //
    // En modo full: viewport COMPLETO, sin restarle el navbar. Antes era
    // `100dvh - navH` (72 mobile / 80 desktop), que asume que el navbar ocupa
    // lugar JUSTO ARRIBA del hero — y no lo hace: es `sticky top-0` desde el tope
    // del documento, así que flota por encima. Restarle su alto sólo dejaba al
    // hero más corto que la pantalla (783px en un viewport de 863). Dividido por
    // la escala del canvas (.kt-zoom-canvas usa zoom).
    // En MÓVIL el hero va a pantalla completa SIEMPRE, aunque el diseño esté en
    // modo Encabezado. Ese modo fija un alto en píxeles (280/320) pensado para
    // una banda arriba de una página ancha; en un teléfono eso es una franja de
    // dos dedos con una foto recortada adentro, y lo primero que se ve del sitio
    // queda pareciendo un banner publicitario. A pantalla completa la foto se
    // lee, que es para lo que está.
    const containerHeight = heroSizeMode(config.settings) === 'full' || bp === 'mobile'
      ? 'calc(100dvh / var(--kt-canvas-scale, 1))'
      : undefined
    return (
      <section
        ref={heroRef}
        className="kt-hero-exit-zoom kt-section-reveal"
        style={{ '--reveal-delay': '10ms' }}
      >
        {/* El que escala es esta capa, no la <section>: escalar la sección hace
            crecer su caja pintada más allá de la de layout y eso SÍ cuenta para
            el área desplazable del documento — o sea barra horizontal. Con el
            escalado un nivel adentro, el `overflow-x: clip` de la sección lo
            recorta antes de que llegue a la página. */}
        <div className="kt-hero-exit-stage">
          <CarouselRenderer config={config} breakpoint={bp} containerHeight={containerHeight} bleed />
        </div>
      </section>
    )
  }

  const goToSlide = (index) => setActiveIndex(index)

  if (slides.length === 0) return null

  return (
    <section
      className="relative min-h-[calc(100dvh/var(--kt-canvas-scale,1))] overflow-hidden kt-section-reveal"
      style={{ '--reveal-delay': '10ms' }}
      onMouseEnter={() => { isPausedRef.current = true }}
      onMouseLeave={() => { isPausedRef.current = false }}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        const isGoldenLine = slide.isGolden === true || slide.translationKey === 'hero3'
        const overlayClass = isGoldenLine
          ? 'absolute inset-0 bg-gradient-to-t from-[#1a0d04] via-[rgba(26,13,4,0.55)] to-[rgba(26,13,4,0.15)]'
          : 'absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.8)] to-[rgba(5,5,5,0.4)]'
        return (
          <div
            key={`bg-${slide.translationKey || slide.imageUrl || index}`}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: isActive ? 1 : 0 }}
            aria-hidden={!isActive}
          >
            {slide.videoUrl ? (
              <video
                src={slide.videoUrl}
                poster={slide.imageUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={slide.imageUrl} alt={slide.title ? `${slide.title} - Kolortec iluminación profesional` : t('a11y.productAlt', 'Kolortec iluminación profesional')} className="h-full w-full object-cover" />
            )}
            <div className={overlayClass} />
          </div>
        )
      })}

      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        const tKey = slide.translationKey || 'hero'
        const isGolden = slide.isGolden === true || tKey === 'hero3'
        const heroTitle = t(`landing.${tKey}.title`, slide.title)
        const heroSubtitle = t(`landing.${tKey}.subtitle`, slide.subtitle)
        const primaryCta = t(`landing.${tKey}.primaryCta`, slide.primaryCta)
        const secondaryCta = t(`landing.${tKey}.secondaryCta`, slide.secondaryCta)
        const heroTitleBase = heroTitle.replace(/\.+$/, '')
        const isRight = slide.textPosition === 'right'
        const alignmentClasses = isRight
          ? 'items-end text-right ml-auto'
          : 'items-start text-left'
        const wrapperPositionClasses = isRight
          ? 'right-0 left-auto pl-6 pr-6 lg:pr-40'
          : 'left-0 right-auto pr-6 pl-6 lg:pl-40'

        const renderCta = (label, href, primary) => {
          const baseClass = primary
            ? 'kt-landing-reveal-item rounded-[8px] bg-primary px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5'
            : 'kt-landing-reveal-item rounded-[8px] border-2 border-white bg-transparent px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]'

          if (!label) return null

          if (href && href.startsWith('#')) {
            const targetId = href.slice(1)
            return (
              <a
                href={href}
                className={baseClass}
                onClick={(event) => {
                  event.preventDefault()
                  const target = document.getElementById(targetId)
                  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {label}
              </a>
            )
          }

          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            return (
              <a href={href} target="_blank" rel="noreferrer" className={baseClass}>
                {label}
              </a>
            )
          }

          if (href) {
            return (
              <Link to={href} className={baseClass}>
                {label}
              </Link>
            )
          }

          return (
            <button type="button" className={baseClass}>
              {label}
            </button>
          )
        }

        return (
          <div
            key={`content-${slide.translationKey || index}`}
            className={`absolute bottom-0 z-[2] pb-[100px] transition-opacity duration-700 ease-out kt-hero-content-enter ${wrapperPositionClasses}`}
            style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
            aria-hidden={!isActive}
          >
            <div className={`flex max-w-[760px] flex-col ${alignmentClasses}`}>
              <div
                className={`kt-landing-reveal-item mb-3 inline-block self-start px-3.5 py-1.5 text-sm font-black ${isGolden ? 'bg-[#f5e9c8] text-[#0a0a0a]' : 'bg-primary text-[#090909]'}`}
                style={isRight ? { alignSelf: 'flex-end' } : undefined}
              >
                {t(`landing.${tKey}.badge`, slide.badge)}
              </div>

              {isGolden ? (
                <>
                  <div
                    aria-hidden="true"
                    className={`kt-landing-reveal-item mb-2 flex w-full max-w-[420px] flex-col gap-[3px] ${isRight ? 'self-end' : 'self-start'}`}
                  >
                    <span className="block h-[3px] bg-[#f4b860]" />
                    <span className="block h-[3px] bg-[#e57b3a]" />
                    <span className="block h-[3px] bg-[#b94e1f]" />
                  </div>
                  <h2
                    className="m-0 mb-4 italic leading-[0.92] text-[#f5e9c8] text-[clamp(4rem,11vw,9rem)]"
                    style={{ fontFamily: "'Pacifico', 'Lobster', cursive" }}
                  >
                    {heroTitleBase}
                  </h2>
                  <div
                    aria-hidden="true"
                    className={`kt-landing-reveal-item -mt-2 mb-3 flex w-full max-w-[420px] flex-col gap-[3px] ${isRight ? 'self-end' : 'self-start'}`}
                  >
                    <span className="block h-[3px] bg-[#b94e1f]" />
                    <span className="block h-[3px] bg-[#e57b3a]" />
                    <span className="block h-[3px] bg-[#f4b860]" />
                  </div>
                </>
              ) : (
                <h2 className="title-font m-0 mb-4 text-[clamp(3.6rem,10vw,8.4rem)] leading-[0.95]">
                  {heroTitleBase}
                  <span className="text-primary">.</span>
                </h2>
              )}

              <p className={`kt-landing-reveal-item m-0 max-w-[680px] text-[clamp(1rem,2.5vw,1.2rem)] ${isGolden ? 'text-[#e8dcb8]' : 'text-[#d4d4d4]'}`}>{heroSubtitle}</p>
              <div className={`mt-6 flex flex-wrap gap-3 ${isRight ? 'justify-end' : 'justify-start'}`}>
                {renderCta(primaryCta, slide.primaryCtaHref, true)}
                {renderCta(secondaryCta, slide.secondaryCtaHref, false)}
              </div>
            </div>
          </div>
        )
      })}

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-[3] flex -translate-x-1/2 gap-2.5" aria-label={t('a11y.heroSlides', 'Slides del encabezado')}>
          {slides.map((slide, index) => (
            <button
              key={`dot-${slide.translationKey || index}`}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-white/45 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default HeroSection
