import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function FeaturedSection({ products }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)
  const sectionCta = t('landing.products.cta', products.cta || 'Ver Productos')

  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const ROTATE_MS = 4000

  const updateBounds = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < maxScroll - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined
    updateBounds()
    el.addEventListener('scroll', updateBounds, { passive: true })
    window.addEventListener('resize', updateBounds)
    return () => {
      el.removeEventListener('scroll', updateBounds)
      window.removeEventListener('resize', updateBounds)
    }
  }, [updateBounds, products.items.length])

  useEffect(() => {
    if (isPaused) return undefined
    if (!products.items || products.items.length <= 1) return undefined

    const id = window.setInterval(() => {
      const el = trackRef.current
      if (!el) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      const firstItem = el.querySelector('[data-featured-item]')
      const itemWidth = firstItem ? firstItem.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
      el.scrollBy({ left: itemWidth, behavior: 'smooth' })
    }, ROTATE_MS)

    return () => window.clearInterval(id)
  }, [isPaused, products.items?.length])

  const scrollByStep = (direction) => {
    const el = trackRef.current
    if (!el) return
    const firstItem = el.querySelector('[data-featured-item]')
    const itemWidth = firstItem ? firstItem.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * itemWidth, behavior: 'smooth' })
  }

  return (
    <section className="px-6 pt-[clamp(84px,11vw,128px)] pb-[clamp(40px,6vw,72px)] lg:px-40 kt-section-reveal" id="products" style={{ '--reveal-delay': '120ms' }}>
      <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
        <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
          <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {sectionTitle}
            <span className="text-primary">.</span>
          </h2>
        </div>
        <Link to="/products" className="kt-landing-reveal-item text-sm font-extrabold uppercase tracking-[0.12em] text-primary">
          {sectionCta}
        </Link>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.items.map((item) => (
            <div
              key={`featured-${item.name}`}
              data-featured-item
              className="kt-landing-reveal-item flex-none snap-start basis-[78%] sm:basis-[44%] md:basis-[32%] xl:basis-[23%]"
            >
              <ProductCard item={item} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          aria-label="Anterior"
          disabled={!canPrev}
          className="absolute -left-6 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-black/55 disabled:hover:text-white md:grid md:h-12 md:w-12 lg:-left-12"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => scrollByStep(1)}
          aria-label="Siguiente"
          disabled={!canNext}
          className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-black/55 disabled:hover:text-white md:grid md:h-12 md:w-12 lg:-right-12"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            aria-label="Anterior"
            disabled={!canPrev}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white transition disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            aria-label="Siguiente"
            disabled={!canNext}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white transition disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
