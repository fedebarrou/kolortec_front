import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ServicesSection({ services }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.services.title', services.title)

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="services" style={{ '--reveal-delay': '200ms' }}>
      <h2 className="title-font mb-[52px] text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
        {sectionTitle}
        <span className="text-primary">.</span>
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.items.map((item) => (
          <article key={item.title} className="kt-landing-reveal-item kt-landing-float-card overflow-hidden rounded-[10px] border border-[#2a2a2a] bg-[#111] md:rounded-[12px]">
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#2a2a2a] sm:aspect-[16/9]">
              <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 ease-out hover:scale-105" />
            </div>
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <h3 className="title-font mb-2 text-[1.1rem] sm:text-[1.25rem] md:text-[1.35rem]">{item.title}</h3>
              <p className="text-[0.85rem] leading-[1.55] text-[#c4c8ce] sm:text-[0.9rem]">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesSection
