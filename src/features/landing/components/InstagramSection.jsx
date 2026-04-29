import { useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function InstagramSection({ gallery }) {
  const { t } = useLanguage()
  const title = t('landing.instagram.title', 'KOLORTEC on Instagram')
  const subtitle = t('landing.instagram.subtitle', gallery.subtitle)

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const loopImages = [...gallery.images, ...gallery.images]

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" style={{ '--reveal-delay': '80ms' }}>
      <div>
        <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
          <div className="kt-landing-reveal-item">
            <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
              {title}
              <span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#a0a0a0]">{subtitle}</p>
          </div>
          <a className="kt-landing-reveal-item mt-3 inline-flex items-center gap-2 text-[0.82rem] font-extrabold uppercase tracking-[0.18em] text-primary underline underline-offset-4" href="#">
            {gallery.cta}
          </a>
        </div>

        <div className="kt-marquee" style={{ '--kt-marquee-duration': '60s' }}>
          <div className="kt-marquee-track">
            {loopImages.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                className="kt-marquee-item kt-marquee-item-portrait m-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                onClick={() => setLightboxIndex(index % gallery.images.length)}
                aria-label={`Abrir imagen ${index + 1} de Instagram`}
              >
                <img
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  src={src}
                  alt="Kolortec en Instagram"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <ImageLightbox
        images={gallery.images}
        initialIndex={lightboxIndex < 0 ? 0 : lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        label="Instagram"
      />
    </section>
  )
}

export default InstagramSection
