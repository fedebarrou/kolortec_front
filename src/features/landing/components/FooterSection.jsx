import { Link } from 'react-router-dom'
import { useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
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

function FooterSection() {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const productLinks = t('footer.productsLinks', ['X-Series Floods', 'Precision Spots', 'Architectural Washes', 'Portable Gear'])
  const companyLinks = t('footer.companyLinks', ['Our Story', 'Projects', 'Careers', 'Contact'])
  const libraryLinks = t('footer.libraryLinks', ['Manuales', 'Firmware', 'Fotometria', 'Soporte Tecnico'])

  return (
    <footer className="bg-deep-black border-t border-slate-800 py-16 px-6 lg:px-20">
      <div className="mb-12 w-full border-b border-slate-800 pb-10">
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

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-6">
            <img alt="Kolortec Logo" className="h-28 w-28 object-contain" src="/assets/footer-logo.jpeg" />
          </div>
          <p className="body-font text-slate-500 text-sm leading-relaxed">
            {t('footer.about', 'Global leaders in high-output industrial lighting solutions. Built for power, designed for performance.')}
          </p>
        </div>

        <div>
          <h4 className="title-font text-white mb-3 text-base md:text-lg font-black">{t('footer.productsTitle', 'Products')}</h4>
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {productLinks.map((label) => (
              <li key={`footer-product-${label}`}>
                <Link className="hover:text-primary transition-colors" to="/tienda">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="title-font text-white mb-3 text-base md:text-lg font-black">{t('footer.companyTitle', 'Company')}</h4>
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            <li><Link className="hover:text-primary transition-colors" to="/">{companyLinks[0] ?? 'Our Story'}</Link></li>
            <li><Link className="hover:text-primary transition-colors" to="/servicios">{companyLinks[1] ?? 'Projects'}</Link></li>
            <li><Link className="hover:text-primary transition-colors" to="/servicios">{companyLinks[2] ?? 'Careers'}</Link></li>
            <li><Link className="hover:text-primary transition-colors" to="/contacto">{companyLinks[3] ?? 'Contact'}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="title-font text-white mb-3 text-base md:text-lg font-black">{t('footer.libraryTitle', 'Libreria y Manuales')}</h4>
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {libraryLinks.map((label) => (
              <li key={`footer-library-${label}`}>
                <Link className="hover:text-primary transition-colors" to="/soporte">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="title-font text-white mb-4 text-base md:text-lg font-black">{t('footer.updatesTitle', 'Updates')}</h4>
          <div className="flex gap-2">
            <input
              className="h-10 bg-slate-800 border-none text-white text-xs focus:ring-1 focus:ring-primary w-full px-3 rounded-lg"
              placeholder={t('footer.emailPlaceholder', 'Email address')}
              type="email"
            />
            <button className="h-10 bg-primary text-background-dark px-4 font-black text-xs hover:bg-white transition-all rounded-lg" type="button">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
        <p>{t('footer.copyright', '© 2024 KOLORTEC LIGHTING SYSTEMS. ALL RIGHTS RESERVED.')}</p>
        <div className="flex gap-6 mt-4 md:mt-0">
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

