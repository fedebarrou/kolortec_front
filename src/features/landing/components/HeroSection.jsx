import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function HeroSection({ hero }) {
  const { t } = useLanguage()
  const heroTitle = t('landing.hero.title', hero.title)
  const heroSubtitle = t('landing.hero.subtitle', hero.subtitle)
  const heroTitleBase = heroTitle.replace(/\.+$/, '')

  return (
    <section className="relative flex min-h-[calc(100svh-72px)] md:min-h-[calc(100svh-80px)] items-end overflow-hidden kt-section-reveal" style={{ '--reveal-delay': '10ms' }}>
      <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.8)] to-[rgba(5,5,5,0.4)]" />
      <div className="kt-hero-beam absolute -top-[20%] left-1/2 h-[140%] w-[150%] -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(244,223,51,0.16)_0%,transparent_65%)]" />
      <div className="relative z-[2] px-6 pb-[100px] lg:px-40 kt-hero-content-enter">
        <div className="kt-landing-reveal-item mb-3 inline-block bg-primary px-3.5 py-1.5 text-sm font-black text-[#090909]">{hero.badge}</div>
        <h1 className="title-font m-0 mb-4 text-[clamp(3.6rem,10vw,8.4rem)] leading-[0.95] tracking-[0]">
          {heroTitleBase}
          <span className="text-primary">.</span>
        </h1>
        <p className="kt-landing-reveal-item m-0 max-w-[680px] text-[clamp(1rem,2.5vw,1.2rem)] text-[#d4d4d4]">{heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="kt-landing-reveal-item rounded-[8px] bg-primary px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5" type="button">
            {hero.primaryCta}
          </button>
          <button className="kt-landing-reveal-item rounded-[8px] border-2 border-white bg-transparent px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]" type="button">
            {hero.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
