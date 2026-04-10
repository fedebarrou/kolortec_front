import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function FeaturedSection({ products }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)

  return (
    <section className="px-6 py-[clamp(64px,9vw,96px)] lg:px-40 kt-section-reveal" id="products" style={{ '--reveal-delay': '120ms' }}>
      <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
        <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
          {sectionTitle}
          <span className="text-primary">.</span>
        </h2>
        <a href="#shop" className="text-sm font-extrabold uppercase tracking-[0.12em] text-primary">
          {products.cta}
        </a>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {products.items.map((item) => (
          <ProductCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  )
}

export default FeaturedSection
