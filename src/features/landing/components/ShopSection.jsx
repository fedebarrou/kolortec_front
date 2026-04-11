import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopSection({ shop }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)

  return (
    <section className="bg-primary py-[clamp(56px,8vw,88px)] text-[#0b0b0b] kt-section-reveal" id="shop" style={{ '--reveal-delay': '160ms' }}>
      <div className="grid items-start gap-8 px-6 lg:grid-cols-2 lg:gap-[34px] lg:px-40">
        <div className="self-start">
          <h2 className="title-font mb-3 text-left text-[clamp(2.4rem,6.8vw,5.4rem)] leading-[0.88] tracking-[0]">
            {sectionTitle}
            <span className="text-[#0b0b0b]">.</span>
          </h2>
          <p className="kt-landing-reveal-item mb-[18px] max-w-[60ch] text-[1.1rem] text-[rgba(5,5,5,0.84)]">{sectionSubtitle}</p>
          <button className="kt-landing-reveal-item rounded-[8px] bg-[#0d0d0d] px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-primary transition hover:-translate-y-0.5" type="button">
            Go to Catalog
          </button>
        </div>
        <div className="kt-landing-reveal-item relative">
          <video
            className="h-[300px] w-full rounded-[8px] border border-[#111] object-cover md:h-[360px] lg:h-[420px]"
            src="/assets/shop-section-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Shop section video"
          />
        </div>
      </div>
    </section>
  )
}

export default ShopSection
