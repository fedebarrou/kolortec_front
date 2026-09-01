import { useMemo } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'

/**
 * PartnersStrip — la tira de marcas que trabajan con Kolortec.
 *
 * Vive en la HOME, pegada a "Querés formar parte": los dos dicen lo mismo
 * —sumate / mirá con quiénes ya trabajamos— y juntos cierran el bloque negro.
 * Estuvo en el footer, que es global y la repetía en todas las páginas.
 * Lleva su PROPIO fondo negro: vive sobre la foto del cierre y tiene que leerse
 * como parte del mismo bloque negro que Sumate, no como una capa aparte. Va en el
 * markup y no en una regla descendiente de index.css a propósito — el fondo es
 * parte de lo que este componente es ahora, no algo que le presta el contenedor.
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
  const clientLogos = useMemo(() => (Array.isArray(logos) ? logos : []), [logos])
  // La lista se REPITE hasta llenar la tira (par de veces: el keyframe desplaza
  // -50% y la segunda mitad tiene que ser idéntica a la primera para que la
  // costura no se vea). Duplicarla una sola vez alcanzaba con muchas marcas, pero
  // con 3 o 4 cargadas el track medía menos que la pantalla y la tira giraba medio
  // vacía. De última las marcas se repiten, que es lo que se espera de un carrusel
  // de logos. Las copias son decorativas (aria-hidden): no se leen N veces.
  const [marqueeRef, repeats] = useMarqueeFill(clientLogos.length, 16)
  const loop = useMemo(() => buildMarqueeLoop(clientLogos, repeats), [clientLogos, repeats])
  // Velocidad constante en px/s: la duración fija de 52s hacía que la tira fuera
  // más rápida cuantas más marcas hubiera cargadas.
  const duration = marqueeDuration(clientLogos.length, 7, 38)

  if (clientLogos.length === 0) return null

  return (
    <section
      className="kt-partners-strip w-full bg-[#050505] px-6 pb-[clamp(56px,7vw,96px)] lg:px-40"
      aria-label={t('landing.partners.aria', 'Marcas que trabajan con Kolortec')}
    >
      <div ref={marqueeRef} className="kt-marquee kt-marquee-reverse" style={{ '--kt-marquee-duration': duration }}>
        <div className="kt-marquee-track">
          {loop.map((logo, index) => {
            // Copia = todo lo que viene después del set base. Sigue siendo un LINK
            // (con la tira repetida, las copias son la mayor parte de lo que se ve
            // girando: dejarlas muertas al click era peor), pero sale del orden de
            // tabulación y se marca aria-hidden para no leerse N veces.
            const duplicado = index >= clientLogos.length
            const contenido = (
              <>
                <Mark logo={logo} />
                <span>{logo.name}</span>
              </>
            )
            return logo.link ? (
              <a
                key={`${logo.name}-${index}`}
                href={logo.link}
                target="_blank"
                rel="noreferrer noopener"
                className="kt-marquee-item-clientlogo"
                aria-hidden={duplicado ? 'true' : undefined}
                tabIndex={duplicado ? -1 : undefined}
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
