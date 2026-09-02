import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useAuth } from '../../../shared/auth/AuthContext'
import { getFooterData, getCategorias } from '../../../shared/services/contentService'

function FooterSection() {
  const { t } = useLanguage()
  const { user } = useAuth()
  // Data-driven: partners (marcas) + galería salen de la cuenta en tiendita. Vacío → se ocultan
  // (antes usaba defaultLandingContent.footer → mostraba partners/imágenes hardcodeados siempre).
  // La TIRA DE MARCAS ya NO vive acá: se mudó a la home, justo debajo de "Querés
  // formar parte" (ver LandingPage). getFooterData() se sigue usando por la
  // galería; sus clientLogos ya no se leen en este componente.
  const [footerData, setFooterData] = useState({ gallery: [], clientLogos: [] })
  useEffect(() => {
    let mounted = true
    getFooterData().then((d) => { if (mounted && d) setFooterData(d) })
    return () => { mounted = false }
  }, [])
  const galleryImages = footerData.gallery
  // Misma regla que la tira de marcas: el track se repite hasta llenar la pantalla
  // (par de veces, por el -50% del keyframe). Con 3 o 4 fotos cargadas duplicar una
  // sola vez dejaba media tira vacía girando.
  const [marqueeRef, repeats] = useMarqueeFill(galleryImages.length, 14)
  const loopImages = useMemo(() => buildMarqueeLoop(galleryImages, repeats), [galleryImages, repeats])
  const galleryDuration = marqueeDuration(galleryImages.length, 8, 40)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  // Columna "Productos" del footer = categorías reales de la cuenta (tiendita). Vacío → "Ver productos".
  const [categorias, setCategorias] = useState([])
  useEffect(() => {
    let mounted = true
    getCategorias().then((c) => { if (mounted && Array.isArray(c)) setCategorias(c) })
    return () => { mounted = false }
  }, [])
  // `to` sale del slug de la categoría: las seis iban TODAS a /products, tirando
  // el dato a la basura. /products/:categorySlug existe y anda.
  const productItems = categorias.length > 0
    ? categorias.slice(0, 6).map((c) => ({
        key: c.slug,
        label: String(c.nombre || '').toLowerCase(),
        to: c.slug ? `/products/${c.slug}` : '/products',
      }))
    : [{ key: 'all', label: t('a11y.allProducts', 'Ver productos'), to: '/products' }]
  const libraryLinks = t('footer.libraryLinks', ['Manuales', 'Librerias'])
  // /garantias no estaba enlazada desde ningún lado (página huérfana) y es
  // exactamente lo que esta columna promete: material de soporte.
  const supportItems = [
    ...libraryLinks.map((label) => ({ key: `lib-${label}`, label, to: '/descargas' })),
    { key: 'garantias', label: t('pageTitle.warranty', 'Guía de Mantenimiento'), to: '/garantias' },
  ]
  // El copyright decía "© 2010" fijo desde siempre. Ahora el año es un marcador
  // en la traducción ({year}, en los dos idiomas) y se sustituye acá: el string
  // traducido sigue siendo dueño de TODO el texto —incluido dónde va el año— en
  // vez de que el componente le meta mano con una expresión regular, que era el
  // parche anterior y se rompía apenas cambiara el formato.
  const copyright = String(
    t('footer.copyright', '© {year} KOLORTEC LIGHTING SYSTEMS. TODOS LOS DERECHOS RESERVADOS.'),
  ).replace('{year}', String(new Date().getFullYear()))

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
        <div ref={marqueeRef} className="kt-marquee" style={{ '--kt-marquee-duration': galleryDuration }}>
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
                  alt={t('a11y.footerAlt', 'Kolortec en acción')}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { const b = e.currentTarget.closest('button'); if (b) b.style.display = 'none' }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      ) : null}

      <div className="w-full grid grid-cols-2 gap-10 px-6 md:grid-cols-4 md:gap-12 lg:px-40">
        <div className="flex flex-col gap-4">
          <img alt={t('a11y.logo', 'Logo de Kolortec')} className="h-28 w-28 object-contain shrink-0 md:h-32 md:w-32" src="/assets/footer-logo.jpeg" />
          <p className="body-font max-w-[34ch] text-[0.78rem] leading-relaxed text-slate-500">
            {t('footer.about', 'Global leaders in high-output industrial lighting solutions. Built for power, designed for performance.')}
          </p>
        </div>

        <div>
          {renderTitle(t('footer.productsTitle', 'Productos'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {productItems.map((it) => (
              <li key={`footer-cat-${it.key}`}>
                <Link className="capitalize hover:text-primary transition-colors" to={it.to}>{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.libraryTitle', 'Soporte'))}
          <ul className="body-font text-slate-400 space-y-4 text-sm">
            {supportItems.map((it) => (
              <li key={`footer-support-${it.key}`}>
                <Link className="hover:text-primary transition-colors" to={it.to}>{it.label}</Link>
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


      {/* La barra legal va sobre su PROPIO fondo, un gris oscuro: es el pie del
          pie, no una fila más del footer, y separarla por color la despega del
          bloque de links sin necesidad de otra línea divisoria. `mt-10` y no
          `mt-6` porque ahora tiene fondo propio y necesita aire por fuera. */}
      <div className="mt-10 w-full bg-[#111114] px-6 py-5 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-40">
        <p>{copyright}</p>
        {/* Los dos legales estuvieron un tiempo fuera de acá: existían como
            `href="#"` y no llevaban a ningún lado, y un link muerto miente peor
            que un link ausente. Ya tienen página propia (/privacidad y
            /terminos), así que vuelven. El pie es el lugar donde se los busca,
            y además es desde donde los indexa un crawler.
            `flex-wrap`: son cuatro links y en 360px no entran en una línea. */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {user ? null : (
            <Link className="hover:text-primary transition-colors" to="/login">
              {t('header.loginAria', 'Iniciar sesión')}
            </Link>
          )}
          <Link className="hover:text-primary transition-colors" to="/contacto">
            {t('pageTitle.contact', 'Contacto')}
          </Link>
          <Link className="hover:text-primary transition-colors" to="/privacidad">
            {t('footer.privacy', 'Privacidad')}
          </Link>
          <Link className="hover:text-primary transition-colors" to="/terminos">
            {t('footer.terms', 'Términos')}
          </Link>
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

