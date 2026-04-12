import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopSection({ shop }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)
  const sideImages = [
    '/assets/hero-bg-kolortec-rain.jpeg',
    '/assets/kolortec-star-logo.jpeg',
    '/assets/shop-section-product.jpeg'
  ]

  return (
    <section className="relative overflow-hidden bg-primary py-[clamp(56px,8vw,88px)] text-[#0b0b0b] kt-section-reveal" id="shop" style={{ '--reveal-delay': '160ms' }}>
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <video
          className="h-full w-full object-cover"
          src="/assets/shop-section-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[rgba(244,223,51,0.74)]" />
      </div>
      <div className="relative z-10 grid items-start gap-8 px-6 lg:grid-cols-2 lg:gap-[34px] lg:px-40">
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

        <div className="kt-landing-reveal-item relative w-full max-w-none justify-self-start lg:ml-auto lg:justify-self-auto lg:max-w-[387px]">
          <div className="grid w-full grid-cols-3 gap-3 pb-4 lg:absolute lg:right-full lg:top-0 lg:bottom-0 lg:mr-2 lg:w-max lg:grid-cols-1 lg:grid-rows-3 lg:pb-0">
            {sideImages.map((imageSrc, index) => (
              <div key={imageSrc} className="relative h-full aspect-square overflow-hidden rounded-[8px] border border-[#111] bg-black/10">
                <img
                  className="block h-full w-full object-cover"
                  src={imageSrc}
                  alt={`Detalle de producto ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
            <img
              className="kt-minimal-logo-spin pointer-events-none absolute bottom-0 right-full mr-10 hidden w-[42px] select-none md:w-[50px] lg:block"
              src="/assets/logo_minimal.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              style={{ filter: 'brightness(0) saturate(100%)' }}
            />
          </div>

          <div className="relative pb-10 pr-12 lg:pb-0 lg:pr-0">
            <div className="relative overflow-hidden rounded-[8px] border border-[#111] bg-black/10">
              <img
                className="block h-auto w-full"
                src="/assets/shop-section-product.jpeg"
                alt="Cabeza movil Kolortec bajo lluvia"
                loading="lazy"
              />
            </div>
            <img
              className="kt-minimal-logo-spin pointer-events-none absolute bottom-0 right-0 w-[42px] select-none md:w-[50px] lg:hidden"
              src="/assets/logo_minimal.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              style={{ filter: 'brightness(0) saturate(100%)' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShopSection
