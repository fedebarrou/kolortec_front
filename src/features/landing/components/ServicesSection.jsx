import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ServicesSection({ services }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.services.title', services.title)

  return (
    <section className="px-6 py-[clamp(64px,9vw,96px)] lg:px-40 kt-section-reveal" id="services" style={{ '--reveal-delay': '200ms' }}>
      <h2 className="title-font mb-[52px] text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
        {sectionTitle}
        <span className="text-primary">.</span>
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.items.map((item) => (
          <article key={item.title} className="overflow-hidden border border-[#2a2a2a] bg-[#111]">
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#2a2a2a]">
              <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 ease-out hover:scale-105" />
            </div>
            <div className="px-4 py-4">
              <h3 className="title-font mb-2 text-[1.35rem]">{item.title}</h3>
              <p className="text-[0.9rem] leading-[1.55] text-[#c4c8ce]">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesSection
