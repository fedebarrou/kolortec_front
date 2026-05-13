import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function HeroSection({ hero }) {
  const { t } = useLanguage()

  const slides = hero?.slides ?? (hero ? [hero] : [])
  const intervalMs = hero?.intervalMs ?? 7000
  const [activeIndex, setActiveIndex] = useState(0)
  const isPausedRef = useRef(false)

  useEffect(() => {
    if (slides.length <= 1) return undefined

    const id = window.setInterval(() => {
      if (isPausedRef.current) return
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [slides.length, intervalMs, activeIndex])

  const goToSlide = (index) => setActiveIndex(index)

  if (slides.length === 0) return null

  return (
    <section
      className="relative min-h-[calc((100dvh-72px)/var(--kt-canvas-scale,1))] md:min-h-[calc((100dvh-80px)/var(--kt-canvas-scale,1))] overflow-hidden kt-section-reveal"
      style={{ '--reveal-delay': '10ms' }}
      onMouseEnter={() => { isPausedRef.current = true }}
      onMouseLeave={() => { isPausedRef.current = false }}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        const isGoldenLine = slide.translationKey === 'hero3'
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
              <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className={overlayClass} />
          </div>
        )
      })}

      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        const tKey = slide.translationKey || 'hero'
        const isGolden = tKey === 'hero3'
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
                {slide.badge}
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
                  <h1
                    className="m-0 mb-4 italic leading-[0.92] text-[#f5e9c8] text-[clamp(4rem,11vw,9rem)]"
                    style={{ fontFamily: "'Pacifico', 'Lobster', cursive" }}
                  >
                    {heroTitleBase}
                  </h1>
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
                <h1 className="title-font m-0 mb-4 text-[clamp(3.6rem,10vw,8.4rem)] leading-[0.95]">
                  {heroTitleBase}
                  <span className="text-primary">.</span>
                </h1>
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
        <div className="absolute bottom-6 left-1/2 z-[3] flex -translate-x-1/2 gap-2.5" aria-label="Hero slides">
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
