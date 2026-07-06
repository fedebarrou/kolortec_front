import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { getFooterData } from '../../../shared/services/contentService'

function renderShape(shape, index) {
  const { type, ...attrs } = shape
  switch (type) {
    case 'circle':
      return <circle key={index} {...attrs} />
    case 'rect':
      return <rect key={index} {...attrs} />
    case 'path':
      return <path key={index} {...attrs} />
    default:
      return null
  }
}

function FooterSection() {
  const { t } = useLanguage()
  // Data-driven: partners (marcas) + galería salen de la cuenta en tiendita. Vacío → se ocultan
  // (antes usaba defaultLandingContent.footer → mostraba partners/imágenes hardcodeados siempre).
  const [footerData, setFooterData] = useState({ gallery: [], clientLogos: [] })
  useEffect(() => {
    let mounted = true
    getFooterData().then((d) => { if (mounted && d) setFooterData(d) })
    return () => { mounted = false }
  }, [])
  const galleryImages = footerData.gallery
  const clientLogos = footerData.clientLogos
  const loopImages = useMemo(() => [...galleryImages, ...galleryImages], [galleryImages])
  const loopClientLogos = useMemo(() => [...clientLogos, ...clientLogos], [clientLogos])
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const productLinks = t('footer.productsLinks', ['X-Series Floods', 'Precision Spots', 'Architectural Washes', 'Portable Gear'])
  const libraryLinks = t('footer.libraryLinks', ['Manuales', 'Librerias'])

  const renderTitle = (label) => (
    <h4 className="title-font mb-4 text-base md:text-lg font-black text-white">
      {label}
      <span className="text-primary">.</span>
    </h4>
  )

  return (
    <footer className="bg-deep-black border-t border-slate-800 py-10">
      {galleryImages.length > 0 ? (
      <div className="mb-16 w-full px-6 lg:px-40 md:mb-20">
        <div className="kt-marquee">
          <div className="kt-marquee-track">
            {loopImages.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                className="kt-marquee-item kt-marquee-item-square m-0 cursor-pointer border-0 bg-transparent p-0"
                onClick={() => setLightboxIndex(index % galleryImages.length)}
                aria-label={`Abrir imagen ${index + 1} del footer`}
              >
                <img
                  className="h-full w-full cursor-pointer object-cover"
                  src={src}
                  alt="Kolortec action"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      ) : null}

      <div className="w-full grid grid-cols-2 gap-10 px-6 md:grid-cols-4 md:gap-12 lg:px-40">
        <div className="flex flex-col gap-4">
          <img alt="Kolortec Logo" className="h-28 w-28 object-contain shrink-0 md:h-32 md:w-32" src="/assets/footer-logo.jpeg" />
          <p className="body-font max-w-[34ch] text-[0.78rem] leading-relaxed text-slate-500">
            {t('footer.about', 'Global leaders in high-output industrial lighting solutions. Built for power, designed for performance.')}
          </p>
        </div>

        <div>
          {renderTitle(t('footer.productsTitle', 'Products'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {productLinks.map((label) => (
              <li key={`footer-product-${label}`}>
                <Link className="hover:text-primary transition-colors" to="/products">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.libraryTitle', 'Soporte'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {libraryLinks.map((label) => (
              <li key={`footer-library-${label}`}>
                <Link className="hover:text-primary transition-colors" to="/soporte">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.updatesTitle', 'Follow Us'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {SOCIAL_LINKS.map((social) => (
              <li key={`footer-social-${social.key}`}>
                <a
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                    <path d={social.path} />
                  </svg>
                  <span>{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {clientLogos.length > 0 ? (
      <div className="mt-8 w-full border-t border-slate-800 pt-6 px-6 lg:px-40">
        <div className="kt-marquee kt-marquee-reverse" style={{ '--kt-marquee-duration': '52s' }}>
          <div className="kt-marquee-track">
            {loopClientLogos.map((logo, index) => (
              <span
                key={`${logo.name}-${index}`}
                className="kt-marquee-item-clientlogo"
                aria-hidden={index >= clientLogos.length ? 'true' : undefined}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="kt-clientlogo-mark">
                  {(logo.shapes ?? []).map(renderShape)}
                </svg>
                <span>{logo.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      ) : null}

      <div className="w-full mt-6 px-6 pt-5 border-t border-slate-800 flex flex-col gap-3 text-xs text-slate-600 md:flex-row md:items-center md:justify-between lg:px-40">
        <p>{t('footer.copyright', '© 2010 KOLORTEC LIGHTING SYSTEMS. ALL RIGHTS RESERVED.')}</p>
        <div className="flex gap-5">
          <a className="hover:text-primary transition-colors" href="#">{t('footer.privacyPolicy', 'Privacy Policy')}</a>
          <a className="hover:text-primary transition-colors" href="#">{t('footer.termsOfService', 'Terms of Service')}</a>
        </div>
      </div>

      <ImageLightbox
        images={galleryImages}
        initialIndex={lightboxIndex < 0 ? 0 : lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        label={t('footer.galleryLabel', 'Footer gallery')}
      />
    </footer>
  )
}

export default FooterSection

