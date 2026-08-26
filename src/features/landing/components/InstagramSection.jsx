import { useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'

const INSTAGRAM = SOCIAL_LINKS.find((s) => s.key === 'instagram')

function InstagramSection({ gallery }) {
  const { t } = useLanguage()
  const followText = t(
    'landing.instagram.followText',
    'Follow {handle} on Instagram and never miss a story again!',
  )
  const handle = t('landing.instagram.handle', '@kolortec')
  const [followBefore, followAfter = ''] = followText.split('{handle}')

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  // El carrusel se muestra SOLO si hay un Instagram REAL conectado al tenant (no galería).
  const showCarousel = !!gallery.connected && gallery.images.length > 0
  const loopImages = showCarousel ? [...gallery.images, ...gallery.images] : []

  return (
    <section className="px-6 pt-[clamp(40px,6vw,72px)] pb-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" style={{ '--reveal-delay': '80ms' }}>
      <div>
        <div className="kt-landing-reveal-item mb-9 flex flex-col items-center gap-4 text-center sm:mb-12">
          <a
            href={INSTAGRAM?.href ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-white transition hover:text-primary"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 fill-current">
              <path d={INSTAGRAM?.path} />
            </svg>
          </a>
          <p className="m-0 max-w-[60ch] text-[clamp(0.95rem,1.6vw,1.15rem)] leading-[1.45] text-[#cfd2d8]">
            {followBefore}
            <a
              href={INSTAGRAM?.href ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-2 underline-offset-[6px] transition hover:opacity-80"
            >
              {handle}
            </a>
            {followAfter}
          </p>
        </div>

        {showCarousel ? (
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
                  alt={t('a11y.instagramAlt', 'Kolortec en Instagram')}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
        ) : null}
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
