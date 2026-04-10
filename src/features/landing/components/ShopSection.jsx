import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopSection({ shop }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)

  return (
    <section className="bg-primary py-[clamp(40px,6vw,64px)] text-[#0b0b0b] kt-section-reveal" id="shop" style={{ '--reveal-delay': '160ms' }}>
      <div className="grid items-center gap-8 px-6 lg:grid-cols-2 lg:gap-[34px] lg:px-40">
        <div>
          <h2 className="title-font mb-3 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[0.9] tracking-[0]">
            {sectionTitle}
            <span className="text-[#0b0b0b]">.</span>
          </h2>
          <p className="mb-[18px] max-w-[60ch] text-[1.1rem] text-[rgba(5,5,5,0.84)]">{sectionSubtitle}</p>
          <button className="rounded-[8px] bg-[#0d0d0d] px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-primary transition hover:-translate-y-0.5" type="button">
            Go to Catalog
          </button>
        </div>
        <div className="relative">
          <img src={shop.mainImage} alt="" className="h-[300px] w-full rounded-[8px] border border-[#111] object-cover md:h-[360px] lg:h-[420px]" />
          <img
            src={shop.secondaryImage}
            alt=""
            className="absolute -left-[22px] -bottom-8 hidden h-[180px] w-[60%] rounded-[8px] border border-[#111] object-cover lg:block"
          />
        </div>
      </div>
    </section>
  )
}

export default ShopSection
