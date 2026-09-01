import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'

function FeaturedSection({ products }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.products.title', products.title)
  const sectionCta = t('landing.products.cta', products.cta || 'Ver Productos')

  const items = useMemo(() => products.items || [], [products.items])
  // Track completo (se repite hasta llenar la pantalla) + velocidad constante en
  // px/s: con una duración fija, más productos = tira más rápida. Ver marquee.js.
  const [marqueeRef, repeats] = useMarqueeFill(items.length, 12)
  const loopItems = useMemo(() => buildMarqueeLoop(items, repeats), [items, repeats])
  const duration = marqueeDuration(items.length, 11, 54)

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

      {/* kt-marquee-cards: pausa en hover (ya la traía .kt-marquee) + la card bajo
          el mouse se agranda. El padding vertical del contenedor es lo que deja
          lugar para ese escalado: .kt-marquee es overflow:hidden. */}
      <div ref={marqueeRef} className="kt-marquee kt-marquee-cards" style={{ '--kt-marquee-duration': duration }}>
        <div className="kt-marquee-track">
          {loopItems.map((item, index) => (
            <div
              key={`featured-${item.slug || item.id || item.name}-${index}`}
              className="kt-marquee-item kt-marquee-item-product"
              aria-hidden={index >= items.length ? 'true' : undefined}
            >
              <ProductCard item={item} focusable={index < items.length} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
