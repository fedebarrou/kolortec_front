import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useAuth } from '../../../shared/auth/AuthContext'
import { getFooterData, getCategorias, getContactChannels, getDatosResponsable } from '../../../shared/services/contentService'

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
  // Fotos que fallaron al cargar: se sacan de la galería entera, no sólo la
  // copia que falló. Con loading=lazy las otras copias del loop fallaban recién
  // al entrar en pantalla y la tira pegaba un salto en el medio (joan REG-005).
  const [rotas, setRotas] = useState(() => new Set())
  const galleryImages = useMemo(
    () => footerData.gallery.filter((src) => !rotas.has(src)),
    [footerData.gallery, rotas],
  )
  // Carrusel que gira (pedido del cliente: la galería del pie se mantiene como
  // estaba). El track se repite hasta llenar la pantalla (par de veces, por el
  // -50% del keyframe): con 3 o 4 fotos duplicar una sola vez dejaba media
  // tira vacía girando.
  const [marqueeRef, repeats] = useMarqueeFill(galleryImages.length, 14)
  const loopImages = useMemo(() => buildMarqueeLoop(galleryImages, repeats), [galleryImages, repeats])
  const galleryDuration = marqueeDuration(galleryImages.length, 8, 40)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  // A sangre, como el resto de las secciones: en pantallas más anchas que el
  // lienzo de 1920 el fondo gris quedaba como una caja con bandas negras.
  const footerRef = useRef(null)
  useFullBleed(footerRef)
  const [canales, setCanales] = useState({})
  const [responsable, setResponsable] = useState({})
  useEffect(() => {
    let mounted = true
    getContactChannels().then((c) => { if (mounted && c) setCanales(c) })
    getDatosResponsable().then((d) => { if (mounted && d) setResponsable(d) })
    return () => { mounted = false }
  }, [])
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
    <h4 className="kt-footer-title title-font">
      {label}
      <span className="text-primary">.</span>
    </h4>
  )

  // Contacto visible en el pie (antes no había ni un dato): WhatsApp de la
  // cuenta + email y teléfono de la empresa. Salen del mismo web-config que ya
  // pide el sitio (no cuesta requests). Lo que no esté cargado no se muestra.
  const waNumero = canales.contacto || canales.ventas || null
  const contactos = [
    waNumero ? { key: 'wa', label: 'WhatsApp', value: formatearTelefono(waNumero), href: `https://wa.me/${waNumero}` } : null,
    // Sólo un email "limpio": uno cargado como a@b.com?bcc=… le agregaría copias
    // ocultas al correo del visitante (sekh SEC-001).
    emailValido(responsable.email) ? { key: 'mail', label: 'Email', value: responsable.email, href: `mailto:${responsable.email}` } : null,
    responsable.telefono
      ? { key: 'tel', label: t('footer.phone', 'Teléfono'), value: responsable.telefono, href: `tel:${String(responsable.telefono).replace(/\D/g, '')}` }
      : null,
  ].filter(Boolean)

  return (
    <footer ref={footerRef} className="kt-footer">
      {galleryImages.length > 0 ? (
        <div className="kt-footer-gal">
          <div ref={marqueeRef} className="kt-marquee" style={{ '--kt-marquee-duration': galleryDuration }}>
            <div className="kt-marquee-track">
              {loopImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className="kt-marquee-item kt-marquee-item-square m-0 cursor-pointer border-0 bg-transparent p-0"
                  onClick={() => setLightboxIndex(index % galleryImages.length)}
                  aria-label={`${t('footer.openImage', 'Abrir imagen')} ${(index % galleryImages.length) + 1}`}
                >
                  <img
                    className="h-full w-full cursor-pointer object-cover"
                    src={src}
                    alt={t('a11y.footerAlt', 'Kolortec en acción')}
                    loading="lazy"
                    decoding="async"
                    onError={() => setRotas((prev) => (prev.has(src) ? prev : new Set(prev).add(src)))}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="kt-footer-cols">
        <div className="kt-footer-brand">
          {/* Logo vectorial (el JPEG tenía su propio fondo negro y se le veía
              el recuadro contra el pie). */}
          <div className="kt-footer-logo title-font" role="img" aria-label={t('a11y.logo', 'Logo de Kolortec')}>
            KOLORTEC
            <svg viewBox="-50 -50 100 100" aria-hidden="true">
              <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" />
              <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" transform="rotate(60)" />
              <polygon points="-12,-42 12,-42 6,0 12,42 -12,42 -6,0" transform="rotate(120)" />
            </svg>
          </div>
          <p>{t('footer.about', 'Global leaders in high-output industrial lighting solutions. Built for power, designed for performance.')}</p>
        </div>

        {contactos.length > 0 ? (
          <div className="kt-footer-contacto">
            {renderTitle(t('footer.contactTitle', 'Contacto'))}
            <ul>
              {contactos.map((c) => (
                <li key={c.key}>
                  <strong>{c.label}</strong>
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    {c.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          {renderTitle(t('footer.productsTitle', 'Productos'))}
          <ul>
            {productItems.map((it) => (
              <li key={`footer-cat-${it.key}`}>
                <Link className="capitalize" to={it.to}>{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.libraryTitle', 'Soporte'))}
          <ul>
            {supportItems.map((it) => (
              <li key={`footer-support-${it.key}`}>
                <Link to={it.to}>{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {renderTitle(t('footer.updatesTitle', 'Follow Us'))}
          <ul>
            {SOCIAL_LINKS.map((social) => (
              <li key={`footer-social-${social.key}`}>
                <a className="kt-footer-social" href={social.href} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                  <span>{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Los dos legales estuvieron un tiempo fuera de acá: existían como
          `href="#"` y no llevaban a ningún lado. Ya tienen página propia
          (/privacidad y /terminos): el pie es donde se los busca y desde donde
          los indexa un crawler. */}
      <div className="kt-footer-legal">
        <p>{copyright}</p>
        <nav aria-label={t('footer.legalNav', 'Legales')}>
          {user ? null : <Link to="/login">{t('header.loginAria', 'Iniciar sesión')}</Link>}
          <Link to="/contacto">{t('pageTitle.contact', 'Contacto')}</Link>
          <Link to="/privacidad">{t('footer.privacy', 'Privacidad')}</Link>
          <Link to="/terminos">{t('footer.terms', 'Términos')}</Link>
        </nav>
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

// Lista blanca, no lista negra: con `%` un email como a@b.com%3Fbcc%3Dx@y.com
// volvía a meter parámetros al decodificarse el mailto (sekh SEC-001).
function emailValido(email) {
  return typeof email === 'string' && /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(email)
}

// 5491124062526 → "+54 9 11 2406-2526". Si el número no tiene la forma
// argentina esperada, se muestra tal cual con un + adelante.
function formatearTelefono(digitos) {
  const d = String(digitos).replace(/\D/g, '')
  const m = d.match(/^54(9?)(11|\d{3,4})(\d{3,4})(\d{4})$/)
  return m ? `+54 ${m[1] ? '9 ' : ''}${m[2]} ${m[3]}-${m[4]}` : `+${d}`
}

export default FooterSection

