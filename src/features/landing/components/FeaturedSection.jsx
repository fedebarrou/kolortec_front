import { Link } from 'react-router-dom'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function FeaturedSection({ products }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)
  const sectionCta = t('landing.products.cta', products.cta || 'Ver Productos')
  const loopItems = [...products.items, ...products.items]

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="products" style={{ '--reveal-delay': '120ms' }}>
      <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
        <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
          {sectionTitle}
          <span className="text-primary">.</span>
        </h2>
        <Link to="/tienda" className="kt-landing-reveal-item text-sm font-extrabold uppercase tracking-[0.12em] text-primary">
          {sectionCta}
        </Link>
      </div>
      <div className="kt-marquee" style={{ '--kt-marquee-duration': '70s' }}>
        <div className="kt-marquee-track">
          {loopItems.map((item, index) => (
            <div key={`featured-${item.name}-${index}`} className="kt-marquee-item kt-marquee-item-product">
              <ProductCard item={item} className="kt-landing-reveal-item" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
