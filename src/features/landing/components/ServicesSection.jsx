import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ServicesSection({ services }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.services.title', services.title)

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="services" style={{ '--reveal-delay': '200ms' }}>
      <h2 className="title-font mb-[52px] text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
        {sectionTitle}
        <span className="text-primary">.</span>
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {services.items.map((item) => (
          <figure
            key={item.title}
            className="kt-landing-reveal-item group relative m-0 aspect-[3/4] overflow-hidden rounded-[10px] md:rounded-[12px]"
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-6 sm:pb-7">
              <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.02] text-white">
                {item.title}
                <span className="text-primary">.</span>
              </h3>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default ServicesSection
