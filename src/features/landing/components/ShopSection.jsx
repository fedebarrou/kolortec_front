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

  const ROTATE_MS = 3500
  const [activeId, setActiveId] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const isAnyExpanded = expandedId !== null
  const sectionRef = useRef(null)
  const [introPhase, setIntroPhase] = useState('priming')

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    if (mq.addEventListener) {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
    mq.addListener(sync)
    return () => mq.removeListener(sync)
  }, [])

  const goPrev = () => {
    const next = (activeId - 1 + carouselItems.length) % carouselItems.length
    setActiveId(next)
    if (isAnyExpanded) setExpandedId(next)
  }
  const goNext = () => {
    const next = (activeId + 1) % carouselItems.length
    setActiveId(next)
    if (isAnyExpanded) setExpandedId(next)
  }

  useEffect(() => {
    if (carouselItems.length <= 1) return undefined
    if (introPhase !== 'done') return undefined
    if (isAnyExpanded) return undefined
    const tick = window.setInterval(() => {
      setActiveId((i) => (i + 1) % carouselItems.length)
    }, ROTATE_MS)
    return () => window.clearInterval(tick)
  }, [carouselItems.length, introPhase, isAnyExpanded])

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
            window.setTimeout(() => setIntroPhase('done'), 1500)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px 12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const phaseClass =
    introPhase === 'playing' ? 'is-playing' : introPhase === 'done' ? 'is-done' : 'is-priming'

  const renderCta = (cta) => {
    const isInternal = cta.href.startsWith('/')
    const isExternal = /^https?:\/\//.test(cta.href)
    const hashMatch = cta.href.match(/^\/?#([\w-]+)$/) || cta.href.match(/^\/#([\w-]+)$/)
    const targetId = hashMatch ? hashMatch[1] : null
    const baseClass =
      'inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] transition hover:-translate-y-0.5'
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
    if (targetId) {
      return (
        <Link
          key={cta.label}
          to={cta.href}
          className={className}
          onClick={(event) => {
            const node = document.getElementById(targetId)
            if (node) {
              event.preventDefault()
              node.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
        >
          {inner}
        </Link>
      )
    }
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

      <div className="kt-shop-content relative z-10 grid items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-12 lg:px-40">
        <div className="kt-shop-from-left flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-8 bg-[#0b0b0b]" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#0b0b0b]">
              {sectionEyebrow}
            </span>
          </div>

          <h2 className="title-font m-0 whitespace-pre-line text-left text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.88]">
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

        <div className="flex flex-col gap-7">
        <div
          className="kt-shop-from-right group relative h-[300px] w-full sm:h-[clamp(460px,72vw,680px)]"
          onMouseEnter={() => { if (!isMobile) setExpandedId(activeId) }}
          onMouseLeave={() => { if (!isMobile) setExpandedId(null) }}
        >
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

            const isCardExpanded = isActive && expandedId === i
            const dimmedForExpansion = isAnyExpanded && !isCardExpanded

            return (
              <article
                key={item.name + i}
                onFocus={() => { if (isActive && !isMobile) setExpandedId(i) }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setExpandedId(null)
                }}
                onClick={() => {
                  if (isMobile) {
                    if (isPrev) goPrev()
                    else if (isNext) goNext()
                    return
                  }
                  if (isActive) {
                    setExpandedId(i)
                  } else if (isPrev) {
                    goPrev()
                  } else if (isNext) {
                    goNext()
                  }
                }}
                tabIndex={isActive ? 0 : -1}
                className="absolute top-1/2 left-1/2 h-[94%] w-[58%] overflow-hidden rounded-[14px] border border-[rgba(11,11,11,0.3)] bg-[#0b0b0b] outline-none focus-visible:ring-2 focus-visible:ring-[#0b0b0b]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:h-full sm:w-[72%]"
                style={{
                  width: isCardExpanded ? 'max(100%, min(128%, 62vh, 600px))' : undefined,
                  height: isCardExpanded ? 'max(115%, min(185%, 86vh, 820px))' : undefined,
                  transform: isCardExpanded
                    ? 'translate(-50%, -50%)'
                    : `translate(-50%, -50%) translateX(${translatePct}%) scale(${scale})`,
                  zIndex: isCardExpanded ? 20 : (dimmedForExpansion ? 0 : zIndex),
                  opacity: dimmedForExpansion ? 0 : opacity,
                  transition:
                    'transform 600ms cubic-bezier(0.22, 0.7, 0.25, 1), opacity 500ms cubic-bezier(0.22, 0.7, 0.25, 1), width 600ms cubic-bezier(0.22, 0.7, 0.25, 1), height 600ms cubic-bezier(0.22, 0.7, 0.25, 1), box-shadow 500ms ease',
                  pointerEvents: isVisible ? 'auto' : 'none',
                  boxShadow: isCardExpanded
                    ? '0 40px 80px rgba(0,0,0,0.6)'
                    : isActive
                      ? '0 28px 60px rgba(0,0,0,0.55)'
                      : '0 14px 32px rgba(0,0,0,0.45)',
                  cursor: isActive ? 'pointer' : 'default',
                }}
                aria-hidden={!isActive}
                aria-expanded={isCardExpanded || undefined}
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
                    {t('warrantyBadge.label', 'Garantia')}
                  </span>
                  <span className="title-font my-[2px] inline-flex items-baseline text-primary">
                    <span className="text-[clamp(2rem,3.8vw,2.7rem)] leading-none">12</span>
                    <span className="ml-0.5 text-[0.95rem] leading-none">M</span>
                  </span>
                  <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">
                    {t('warrantyBadge.footer', 'de fabrica')}
                  </span>
                </div>

                <div
                  className="absolute inset-x-4 bottom-4 flex flex-col gap-1.5 sm:inset-x-5 sm:bottom-5"
                  style={{
                    opacity: isCardExpanded ? 0 : 1,
                    transition: 'opacity 280ms ease',
                  }}
                >
                  <h3 className="title-font m-0 text-[clamp(1.3rem,2.4vw,1.85rem)] leading-[0.95] text-white">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div
                  aria-hidden={!isCardExpanded}
                  className="absolute inset-x-0 bottom-0 flex flex-col gap-2 border-t-2 border-primary bg-gradient-to-b from-[rgba(11,11,11,0.97)] to-[#050505] px-5 py-4 sm:px-7 sm:py-5"
                  style={{
                    transform: isCardExpanded ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 600ms cubic-bezier(0.22, 0.7, 0.25, 1)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="block h-[2px] w-6 bg-primary" />
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-primary">
                      {item.description}
                    </span>
                  </div>
                  <h3 className="title-font m-0 text-[clamp(1.4rem,2.4vw,2.1rem)] leading-[1] text-white">
                    {item.name}
                    <span className="text-primary">.</span>
                  </h3>
                  {item.longDescription ? (
                    <p className="m-0 text-[0.86rem] leading-[1.5] text-[#aeb5bf] sm:text-[0.95rem]">
                      {item.longDescription}
                    </p>
                  ) : null}
                </div>
              </article>
            )
          })}

          {carouselItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                aria-label="Producto anterior"
                className="absolute top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-primary/40 bg-black/60 text-primary opacity-95 backdrop-blur-sm transition duration-300 hover:scale-105 hover:border-primary hover:bg-primary hover:text-black left-2 sm:left-auto sm:-left-16 sm:h-12 sm:w-12 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 lg:-left-32"
              >
                <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden="true">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                aria-label="Producto siguiente"
                className="absolute top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-primary/40 bg-black/60 text-primary opacity-95 backdrop-blur-sm transition duration-300 hover:scale-105 hover:border-primary hover:bg-primary hover:text-black right-2 sm:right-auto sm:-right-16 sm:h-12 sm:w-12 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 lg:-right-32"
              >
                <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden="true">chevron_right</span>
              </button>
            </>
          ) : null}

        </div>

          {carouselItems.length > 1 ? (
            <div
              className="flex justify-center gap-2"
              aria-label="Paginacion del carrusel"
              style={{
                transform: isAnyExpanded ? 'translateY(56px)' : undefined,
                transition: 'transform 600ms cubic-bezier(0.22, 0.7, 0.25, 1)',
              }}
            >
              {carouselItems.map((item, i) => (
                <button
                  key={`dot-${item.name}-${i}`}
                  type="button"
                  onClick={() => {
                    setActiveId(i)
                    if (isAnyExpanded) setExpandedId(i)
                  }}
                  aria-label={`Ir al producto ${i + 1} de ${carouselItems.length}`}
                  aria-current={i === activeId ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all ${i === activeId ? 'w-6 bg-[#0b0b0b]' : 'w-2 bg-[#0b0b0b]/30 hover:bg-[#0b0b0b]/55'}`}
                />
              ))}
            </div>
          ) : null}

        </div>
      </div>
    </section>
  )
}

export default ShopSection
