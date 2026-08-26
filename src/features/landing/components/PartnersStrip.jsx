import { useMemo } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * PartnersStrip — la tira de marcas que trabajan con Kolortec.
 *
 * Vivía inline en el footer, o sea en TODAS las páginas. Se movió a la home,
 * entre Contacto y "Querés formar parte", que es donde el cliente la quiere.
 *
 * De paso se arregló algo que estaba roto desde siempre: el mapper de la API
 * (contentService.mapMarcasToClientLogos) devuelve `{ name, logo, link }`, pero
 * el JSX sólo dibujaba `logo.shapes` — un campo que la API NUNCA manda: sólo
 * existe en la data demo de landingData.js. Con marcas reales cargadas se veía
 * un <svg> VACÍO más el nombre en texto. Ahora la imagen manda, las shapes son
 * el fallback de la demo, y si no hay ninguna de las dos queda sólo el nombre.
 */
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

function Mark({ logo }) {
  if (logo.logo) {
    return <img className="kt-clientlogo-img" src={logo.logo} alt="" loading="lazy" decoding="async" />
  }
  if (logo.shapes?.length) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="kt-clientlogo-mark">
        {logo.shapes.map(renderShape)}
      </svg>
    )
  }
  return null
}

function PartnersStrip({ logos }) {
  const { t } = useLanguage()
  const clientLogos = Array.isArray(logos) ? logos : []
  // La lista va duplicada: el keyframe desplaza -50% y el segundo juego tapa la
  // costura. La copia es decorativa (aria-hidden) para que no se lea dos veces.
  const loop = useMemo(() => [...clientLogos, ...clientLogos], [clientLogos])

  if (clientLogos.length === 0) return null

  return (
    <section
      className="px-6 py-[clamp(44px,6vw,84px)] lg:px-40 kt-section-reveal"
      style={{ '--reveal-delay': '40ms' }}
      aria-label={t('landing.partners.aria', 'Marcas que trabajan con Kolortec')}
    >
      <div className="kt-marquee kt-marquee-reverse" style={{ '--kt-marquee-duration': '52s' }}>
        <div className="kt-marquee-track">
          {loop.map((logo, index) => {
            const duplicado = index >= clientLogos.length
            const contenido = (
              <>
                <Mark logo={logo} />
                <span>{logo.name}</span>
              </>
            )
            return logo.link && !duplicado ? (
              <a
                key={`${logo.name}-${index}`}
                href={logo.link}
                target="_blank"
                rel="noreferrer noopener"
                className="kt-marquee-item-clientlogo"
              >
                {contenido}
              </a>
            ) : (
              <span
                key={`${logo.name}-${index}`}
                className="kt-marquee-item-clientlogo"
                aria-hidden={duplicado ? 'true' : undefined}
              >
                {contenido}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PartnersStrip
