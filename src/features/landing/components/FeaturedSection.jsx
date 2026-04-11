import { useRef, useState } from 'react'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function FeaturedSection({ products }) {
  const [activePage, setActivePage] = useState(0)
  const carouselRef = useRef(null)
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)
  const totalItems = products.items.length

  const onCarouselScroll = () => {
    const viewport = carouselRef.current
    if (!viewport) return
    const current = Math.round(viewport.scrollLeft / Math.max(viewport.clientWidth, 1))
    setActivePage(Math.max(0, Math.min(current, totalItems - 1)))
  }

  const scrollToPage = (index) => {
    const viewport = carouselRef.current
    if (!viewport) return
    viewport.scrollTo({
      left: viewport.clientWidth * index,
      behavior: 'smooth',
    })
  }

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="products" style={{ '--reveal-delay': '120ms' }}>
      <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
        <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
          {sectionTitle}
          <span className="text-primary">.</span>
        </h2>
        <a href="#shop" className="kt-landing-reveal-item text-sm font-extrabold uppercase tracking-[0.12em] text-primary">
          {products.cta}
        </a>
      </div>
      <div className="hidden md:grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {products.items.map((item) => (
          <ProductCard key={item.name} item={item} className="kt-landing-reveal-item kt-landing-float-card" />
        ))}
      </div>

      <div className="md:hidden">
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={onCarouselScroll}
        >
          {products.items.map((item) => (
            <div key={`featured-mobile-${item.name}`} className="min-w-full snap-start pr-1">
              <ProductCard item={item} className="kt-landing-reveal-item kt-landing-float-card" />
            </div>
          ))}
        </div>

        {totalItems > 1 ? (
          <div className="mt-3 flex justify-center gap-2" aria-label="Paginacion colecciones destacadas">
            {products.items.map((_, index) => (
              <button
                key={`featured-dot-${index}`}
                type="button"
                className={`h-2.5 w-2.5 rounded-full transition ${index === activePage ? 'bg-primary' : 'bg-white/35'}`}
                onClick={() => scrollToPage(index)}
                aria-label={`Ir a coleccion ${index + 1}`}
                aria-current={index === activePage ? 'true' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default FeaturedSection
