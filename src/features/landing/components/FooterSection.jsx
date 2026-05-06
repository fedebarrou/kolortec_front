import { Link } from 'react-router-dom'
import { useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

const galleryImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBAk8xJE2XT1Foa5Ec4lOomjgNvVOZryqaHeSwwOZE7ZJ9zSC0kCC6wBBUWtZpERFTwjAL5Xs6zy_zBCz27Bhs8dQ6YL9bMmnIe01AJYhb0PjwH_Dc4Zwz7QlQI6CgeaEeoHI89r9msntrSnKdfeO7vZfdL27FkN0YB5cB8LDZsTrChmm2Zg3HzmFoDoj4E4ZtsaH5B8WnXVNmq7iXF7NPSaRqaL_Zm1p8qSOo-uIVU0lm7pyGyY2aR21RoVXxs4b-R3to5hzOGz9Rg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCypef3PVjSV3YK6CepcWkWR0i8Bh-miz58lQCYRSVg0SgKpSKvsyc0p5NpwpjgTFSoPGHSdUPBbNUvjyz9PTbFGXuj_a5hFDW4sVPOTZayWpiNdtS9AFxmmK3I8-tOaQDgahmq0nzy4pnrths94QDPzYfXaXDf339TLXarQGh0VIHk49ZB6Dmjta4RHzxgizPZ-FFt1jfj5uOLzeUa-oTa_iwq5vJdkbC_UmP1pNDkXeZMRfLa_n5B545LjJGfsHks1QNbYjkvouDH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC2EWe-uuSaf7i_LMP1tTYinCIl-CBhxio-9pyUreTXSFoNyHAXHOaEf2f3mAzxB1sdLnMRE0VSCTgThyVyV3FFxt-8LR-GvD5WAtlWfMkyVg20pbibyEHXGH6S0FpF3Pt6o8LOzr1WVr09_rVj4vDWMd0ABvDy1sy5NQKi1JqoUfo13IF4L8UNCyyi2Q5elAOmO-WFmuOH9h4Fzo79_tyOGjSBfvdn6_a594n7TwZxJLwBk7E9pmCmFn1R6uLs2LyksRel-4Qw3Mjw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDuDWoYWFdPatIK7IKyR1lzoi6eeQcWUqLYdKTvvv7eV3IG_Z_fwdDtReS8AB5OPs33H9bwf6TgFh01MqFay6XE_xYQLC--Nc1yfVOiDA4KfIuUC_WEhFsPw36yz-CKtqb2xOC9R9ML6VIM2SJ4jCnSaXa_TN8mwvks8W8OTcI5QKjf6BzJlQ7GdLIvB83S05nywhqsgJO3Qc79J4qkSURkC3krHT1HY8DbSfAPhZc48EX4bAEdzKb5ksxNzHw7FZce3j7Z16OCyZjm',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVWdCnEpF7E5Fd-091qSyotNax06fw3gMA5HNd_gRK0DBjsnAjJVpVJ963q3lpIKcKg58eSnWvnpaiHrB5SwLPArUVdrs1gZj7HbIZ7EiCHqQqDsDiUObLI5V0gHF2asDZXl-aZp1D_NIC6UcO4iNa2xrfvYeG_aROQCltd9hK8_PfFJ8D1y16pZQZiyRcjFzGUqUSK8GnGeLaI1Vk8_nCvuSPLHGtza9HU30Zu5aL4X4IWrQFXZaA5Gb8nROZzR47rSbVcqc5a_2T',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDWcNNqvhbO3-kWmHhlyIf67ZnRuenDR6Nke_atIH4P0iBTbbk3h1cUIppnokV_MguAoBV17cu80eWEFUny1UFmMARYd74eahe05y2QfjB5YYOJbuqTApJ0aHSS7kEI4_DBhdLSpF0yhBpNeW0YhXxk3Y4bCGmmaIDPrT9h6jUbEDpqpeKozkP5ksPOeXMTU5DRvxl3DwuyKqZF5CuDT05BEvR6iVbtyhdFVCBxdlAI-cvEVmwu4Lfi7SkXv6ccsmpWhVzPejxoZcwM',
]

const loopImages = [...galleryImages, ...galleryImages]

const CLIENT_LOGOS = [
  { name: 'AURORA', mark: <circle cx="12" cy="12" r="7" /> },
  { name: 'BLACKLINE', mark: <><rect x="3" y="9" width="18" height="2" /><rect x="3" y="13" width="12" height="2" /></> },
  { name: 'CONCRETE LIVE', mark: <><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></> },
  { name: 'DAYLIGHT STUDIO', mark: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></> },
  { name: 'ECHO ARENA', mark: <path d="M3 12c3-6 6-6 9 0s6 6 9 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /> },
  { name: 'FRAMEWORKS', mark: <path d="M5 5h6v6H5zm8 0h6v6h-6zm-8 8h6v6H5zm8 0h6v6h-6z" stroke="currentColor" strokeWidth="1.6" fill="none" /> },
  { name: 'HEMISPHERE', mark: <path d="M12 3l9 5.2v7.6L12 21l-9-5.2V8.2z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" /> },
  { name: 'IGNITE PRO', mark: <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5z" /> },
  { name: 'NORTHWAVE', mark: <path d="M3 19l5-9 4 6 4-9 5 12z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" /> },
  { name: 'PRISMA STAGE', mark: <path d="M12 3l9 16H3z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" /> },
]

const loopClientLogos = [...CLIENT_LOGOS, ...CLIENT_LOGOS]

function FooterSection() {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const productLinks = t('footer.productsLinks', ['X-Series Floods', 'Precision Spots', 'Architectural Washes', 'Portable Gear'])
  const libraryLinks = t('footer.libraryLinks', ['Manuales', 'Librerias'])
  const listsLinks = t('footer.listsLinks', ['Lista 146', 'Lista 145', 'Lista 144'])

  const renderTitle = (label) => (
    <h4 className="title-font mb-4 text-base md:text-lg font-black text-white">
      {label}
      <span className="text-primary">.</span>
    </h4>
  )

  return (
    <footer className="bg-deep-black border-t border-slate-800 py-16">
      <div className="mb-12 w-full px-6 lg:px-40">
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

      <div className="w-full grid grid-cols-2 gap-10 px-6 md:grid-cols-4 md:gap-12 lg:px-40">
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
          {renderTitle(t('footer.listsTitle', 'Listas'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {listsLinks.map((label) => (
              <li key={`footer-list-${label}`}>
                <a className="hover:text-primary transition-colors" href="#">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.updatesTitle', 'Follow Us'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {SOCIAL_LINKS.map((social) => {
              const showHandle = social.key === 'instagram' || social.key === 'facebook'
              return (
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
                  {showHandle ? (
                    <span className="text-primary">@kolortec</span>
                  ) : null}
                </a>
              </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-14 w-full border-t border-slate-800 pt-8 px-6 lg:px-40">
        <div className="kt-marquee kt-marquee-reverse" style={{ '--kt-marquee-duration': '52s' }}>
          <div className="kt-marquee-track">
            {loopClientLogos.map((logo, index) => (
              <span
                key={`${logo.name}-${index}`}
                className="kt-marquee-item-clientlogo"
                aria-hidden={index >= CLIENT_LOGOS.length ? 'true' : undefined}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="kt-clientlogo-mark">
                  {logo.mark}
                </svg>
                <span>{logo.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full mt-10 px-6 pt-8 border-t border-slate-800 flex flex-col gap-6 md:flex-row md:items-center md:justify-between lg:px-40">
        <div className="flex items-center gap-4">
          <img alt="Kolortec Logo" className="h-20 w-20 object-contain shrink-0 md:h-24 md:w-24" src="/assets/footer-logo.jpeg" />
          <p className="body-font max-w-[42ch] text-[0.78rem] leading-relaxed text-slate-500">
            {t('footer.about', 'Global leaders in high-output industrial lighting solutions. Built for power, designed for performance.')}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-600 md:items-end md:text-right">
          <p>{t('footer.copyright', '© 2010 KOLORTEC LIGHTING SYSTEMS. ALL RIGHTS RESERVED.')}</p>
          <div className="flex gap-5">
            <a className="hover:text-primary transition-colors" href="#">{t('footer.privacyPolicy', 'Privacy Policy')}</a>
            <a className="hover:text-primary transition-colors" href="#">{t('footer.termsOfService', 'Terms of Service')}</a>
          </div>
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

