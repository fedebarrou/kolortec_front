import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

const FALLBACK_CAROUSEL_IMAGES = [
  '/assets/products/prod-001.webp',
  '/assets/products/prod-005.webp',
  '/assets/products/prod-009.webp',
  '/assets/products/prod-013.webp',
  '/assets/products/prod-016.webp',
]

function SupportSection({ support }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const contactOptions = support.contacts ?? []
  const carouselImages = useMemo(
    () => (Array.isArray(support.carouselImages) && support.carouselImages.length > 0
      ? support.carouselImages
      : FALLBACK_CAROUSEL_IMAGES),
    [support.carouselImages],
  )

  const [activeId, setActiveId] = useState(0)
  const [isHorizontal, setIsHorizontal] = useState(false)
  const len = carouselImages.length

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsHorizontal(mq.matches)
    sync()
    if (mq.addEventListener) {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
    mq.addListener(sync)
    return () => mq.removeListener(sync)
  }, [])

  const goPrev = () => setActiveId((i) => (i - 1 + len) % len)
  const goNext = () => setActiveId((i) => (i + 1) % len)

  const getRelativePos = (i, current, total) => {
    let p = i - current
    if (p > total / 2) p -= total
    if (p < -total / 2) p += total
    return p
  }

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      <div className="grid gap-8 lg:grid-cols-[1.22fr_1fr] lg:items-stretch">
        <div className="grid gap-5">
          <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
            <h2 className="title-font mb-2 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
              {sectionTitle}<span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#aab2be]">{sectionSubtitle}</p>
          </div>
          <ul className="grid list-none gap-0 border-y border-[rgba(255,255,255,0.14)] p-0">
            {contactOptions.map((item) => (
              <li key={item.label} className="kt-landing-reveal-item border-b border-[rgba(255,255,255,0.12)] last:border-b-0">
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="grid gap-1 py-3.5 transition hover:translate-x-0.5"
                >
                  <strong className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.08em] text-[#f2f4f8]">
                    <span className="material-symbols-outlined inline-flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(244,223,51,0.45)] text-[15px] text-primary" aria-hidden="true">
                      {item.href.startsWith('mailto') ? 'mail' : 'chat'}
                    </span>
                    {item.label}
                  </strong>
                  <span className="text-[0.9rem] text-[#aeb5bf]">{item.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="kt-landing-reveal-item relative min-h-[260px] sm:min-h-[400px] lg:min-h-0 lg:h-full">
          <button
            type="button"
            onClick={goPrev}
            aria-label={t('common.previousImage', 'Imagen anterior')}
            className="absolute z-10 inline-flex items-center justify-center text-primary transition hover:scale-110 -left-2 top-1/2 -translate-y-1/2 lg:left-1/2 lg:top-auto lg:-top-9 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
              <path d={isHorizontal ? 'M15 6l-6 6 6 6' : 'M6 15l6-6 6 6'} />
            </svg>
          </button>

          <div className="absolute inset-0 overflow-hidden">
            {carouselImages.map((src, i) => {
              const pos = getRelativePos(i, activeId, len)
              const isVisible = Math.abs(pos) <= 1
              return (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: isHorizontal
                      ? `translateX(${pos * 100}%)`
                      : `translateY(${pos * 100}%)`,
                    opacity: isVisible ? 1 : 0,
                    transition:
                      'transform 700ms cubic-bezier(0.4, 0, 0.2, 1), opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    maskImage: isHorizontal
                      ? 'linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)'
                      : 'linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
                    WebkitMaskImage: isHorizontal
                      ? 'linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)'
                      : 'linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
                  }}
                />
              )
            })}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] lg:to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]"
            />
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label={t('common.nextImage', 'Imagen siguiente')}
            className="absolute z-10 inline-flex items-center justify-center text-primary transition hover:scale-110 -right-2 top-1/2 -translate-y-1/2 lg:left-1/2 lg:right-auto lg:top-auto lg:-bottom-9 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
              <path d={isHorizontal ? 'M9 6l6 6-6 6' : 'M6 9l6 6 6-6'} />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default SupportSection
