import { Link } from 'react-router-dom'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function FeaturedSection({ products }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)
  const sectionCta = t('landing.products.cta', products.cta || 'Ver Productos')

  const items = products.items || []
  const loopItems = [...items, ...items]

  return (
    <section className="px-6 pt-[clamp(84px,11vw,128px)] pb-[clamp(40px,6vw,72px)] lg:px-40 kt-section-reveal" id="products" style={{ '--reveal-delay': '120ms' }}>
      <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
        <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
          <h2 className="title-font m-0 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {sectionTitle}<span className="text-primary">.</span>
          </h2>
        </div>
        <Link to="/products" className="kt-landing-reveal-item text-sm font-extrabold uppercase tracking-[0.12em] text-primary">
          {sectionCta}
        </Link>
      </div>

      <div className="kt-marquee" style={{ '--kt-marquee-duration': '38s' }}>
        <div className="kt-marquee-track">
          {loopItems.map((item, index) => (
            <div
              key={`featured-${item.name}-${index}`}
              className="kt-marquee-item kt-marquee-item-product"
            >
              <ProductCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
