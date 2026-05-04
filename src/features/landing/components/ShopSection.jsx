import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopSection({ shop, products = [] }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)
  const sectionEyebrow = t('landing.shop.eyebrow', 'Warranty Program')
  const ctas = shop.ctas ?? []
  const fallbackImage = shop.mainImage ?? '/assets/shop-section-product.jpeg'

  const carouselItems = products.length > 0
    ? products
    : [{ name: 'Kolortec', image: fallbackImage }]

  const ROTATE_MS = 4500
  const [activeId, setActiveId] = useState(0)
  const sectionRef = useRef(null)
  const [introPhase, setIntroPhase] = useState('priming')

  useEffect(() => {
    if (carouselItems.length <= 1) return undefined
    if (introPhase !== 'done') return undefined
    const tick = window.setInterval(() => {
      setActiveId((i) => (i + 1) % carouselItems.length)
    }, ROTATE_MS)
    return () => window.clearInterval(tick)
  }, [carouselItems.length, introPhase])

  const getRelativePos = (i, current, len) => {
    let p = i - current
    if (p > len / 2) p -= len
    if (p < -len / 2) p += len
    return p
  }

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setIntroPhase('done')
      return undefined
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIntroPhase('playing')
            window.setTimeout(() => setIntroPhase('done'), 2100)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.45, rootMargin: '0px 0px -10% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const phaseClass =
    introPhase === 'playing' ? 'is-playing' : introPhase === 'done' ? 'is-done' : 'is-priming'

  const renderCta = (cta) => {
    const isInternal = cta.href.startsWith('/')
    const isExternal = /^https?:\/\//.test(cta.href)
    const baseClass =
      'kt-landing-reveal-item inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] transition hover:-translate-y-0.5'
    const variantClass =
      cta.variant === 'primary'
        ? 'bg-[#0b0b0b] text-primary shadow-[0_8px_22px_rgba(0,0,0,0.3)] hover:bg-[#1a1a1a]'
        : 'border-2 border-[#0b0b0b] bg-transparent text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-primary'
    const className = `${baseClass} ${variantClass}`
    const inner = (
      <>
        {cta.icon ? (
          <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
            {cta.icon}
          </span>
        ) : null}
        <span>{cta.label}</span>
      </>
    )
    if (isInternal) {
      return (
        <Link key={cta.label} to={cta.href} className={className}>
          {inner}
        </Link>
      )
    }
    return (
      <a
        key={cta.label}
        href={cta.href}
        className={className}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
      >
        {inner}
      </a>
    )
  }

  return (
    <section
      id="shop"
      ref={sectionRef}
      className={`kt-shop-section ${phaseClass} relative isolate overflow-hidden bg-primary py-[clamp(72px,10vw,128px)] text-[#0b0b0b]`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <video
          className="h-full w-full object-cover"
          src="/assets/shop-section-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[rgba(244,223,51,0.74)]" />
      </div>

      {introPhase !== 'done' ? (
        <>
          <div className={`kt-shop-curtain ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
          <div
            aria-hidden="true"
            className={`kt-shop-logo-sweep ${introPhase === 'playing' ? 'is-playing' : ''}`}
          />
          <div className={`kt-shop-flash ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
        </>
      ) : null}

      <div className="kt-shop-content relative z-10 grid items-center gap-10 px-6 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16 lg:px-40">
        <div className="kt-shop-from-left flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-8 bg-[#0b0b0b]" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#0b0b0b]">
              {sectionEyebrow}
            </span>
          </div>

          <h2 className="title-font m-0 text-left text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.88]">
            {sectionTitle}
            <span className="text-[#0b0b0b]">.</span>
          </h2>

          <p className="max-w-[58ch] text-[1.05rem] leading-[1.55] text-[rgba(11,11,11,0.78)]">
            {sectionSubtitle}
          </p>

          {ctas.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2.5">{ctas.map(renderCta)}</div>
          ) : null}
        </div>

        <div className="kt-shop-from-right relative h-[280px] w-full sm:h-[clamp(420px,68vw,560px)]">
          {carouselItems.map((item, i) => {
            const pos = getRelativePos(i, activeId, carouselItems.length)
            const isActive = pos === 0
            const isPrev = pos === -1
            const isNext = pos === 1
            const isVisible = Math.abs(pos) <= 1

            let translatePct = pos > 0 ? 130 : -130
            let scale = 0.55
            let opacity = 0
            let zIndex = 0
            if (isActive) {
              translatePct = 0
              scale = 1
              opacity = 1
              zIndex = 3
            } else if (isPrev) {
              translatePct = -68
              scale = 0.78
              opacity = 0.5
              zIndex = 1
            } else if (isNext) {
              translatePct = 68
              scale = 0.78
              opacity = 0.5
              zIndex = 1
            }

            return (
              <article
                key={item.name + i}
                className="absolute top-1/2 left-1/2 h-[94%] w-[50%] overflow-hidden rounded-[14px] border border-[rgba(11,11,11,0.3)] bg-[#0b0b0b] sm:h-full sm:w-[64%]"
                style={{
                  transform: `translate(-50%, -50%) translateX(${translatePct}%) scale(${scale})`,
                  zIndex,
                  opacity,
                  transition:
                    'transform 720ms cubic-bezier(0.22, 0.7, 0.25, 1), opacity 720ms cubic-bezier(0.22, 0.7, 0.25, 1)',
                  pointerEvents: isVisible ? 'auto' : 'none',
                  boxShadow: isActive
                    ? '0 28px 60px rgba(0,0,0,0.55)'
                    : '0 14px 32px rgba(0,0,0,0.45)',
                }}
                aria-hidden={!isActive}
              >
                <img
                  src={item.image}
                  alt={isActive ? item.name : ''}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background: isActive
                      ? 'linear-gradient(to bottom, rgba(11,11,11,0.32) 0%, rgba(11,11,11,0.5) 55%, rgba(11,11,11,0.94) 100%)'
                      : 'rgba(11,11,11,0.45)',
                  }}
                />

                <div
                  className="absolute left-4 top-4 inline-flex flex-col items-center bg-[#0b0b0b] px-3 py-3 text-center leading-[1] ring-2 ring-primary"
                  style={{ transform: 'rotate(-8deg)' }}
                >
                  <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">
                    Garantia
                  </span>
                  <span className="title-font my-[2px] inline-flex items-baseline text-primary">
                    <span className="text-[clamp(2rem,3.8vw,2.7rem)] leading-none">12</span>
                    <span className="ml-0.5 text-[0.95rem] leading-none">M</span>
                  </span>
                  <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">
                    de fabrica
                  </span>
                </div>

                <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1.5 sm:inset-x-5 sm:bottom-5">
                  <h3 className="title-font m-0 text-[clamp(1.3rem,2.4vw,1.85rem)] leading-[0.95] text-white">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </article>
            )
          })}

        </div>
      </div>
    </section>
  )
}

export default ShopSection
