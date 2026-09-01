import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useAutoTranslatedDict } from '../../../shared/services/useAutoTranslatedDict'

const slugifyProductName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Etiquetas del producto. La API las manda como `badges` de la variante principal
 * ([{label, color}], saneadas por BadgeSanitizer: máximo 3, label ≤ 20 chars) y el
 * adapter las normaliza a `item.tags`. Se aceptan strings sueltos por si algún
 * fallback/demo las trae planas.
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? { label: tag, color: null } : tag))
    .filter((tag) => tag && typeof tag.label === 'string' && tag.label.trim() !== '')
    .slice(0, 3)
}

/**
 * ProductCard — la ficha de producto de TODA la web (destacados, catálogo, línea,
 * relacionados).
 *
 * Muestra NOMBRE + CATEGORÍA + ETIQUETAS, y nada más. Antes imprimía la
 * `descripcion` de la DB en un renglón de 0.68rem en mayúsculas: ese campo es
 * texto libre de varias líneas cargado en el admin, así que en la card salía
 * cortado, en mayúsculas y sin relación con lo que se ve — ruido, no información.
 * Lo que identifica un equipo en una grilla es su nombre y de qué familia es.
 *
 * El CTA es un <Link> REAL por encima del overlay (z-20): en desktop el overlay
 * invisible cubre toda la card, pero en mobile está apagado (`hidden md:block`),
 * así que sin esto el botón no llevaría a ningún lado en el teléfono.
 *
 * `focusable=false` para las COPIAS de un carrusel infinito: siguen clickeables
 * con el mouse (son la mitad de lo que se ve girando) pero salen del orden de
 * tabulación, que es lo que permite marcarlas aria-hidden sin dejar foco atrapado
 * adentro de contenido oculto para el lector de pantalla.
 */
function ProductCard({ item, className = '', style, showDetailLink = true, detailHref, focusable = true }) {
  const { t } = useLanguage()
  const [imgFailed, setImgFailed] = useState(false)
  // El nombre y la categoría vienen de la DB de tiendita, siempre en castellano —
  // el i18n estático no los alcanza. Se traducen al vuelo y se muestra el original
  // hasta que llega la traducción.
  const dict = useAutoTranslatedDict(useMemo(() => [item.name, item.category], [item.name, item.category]))
  const name = dict.get(item.name) || item.name
  const category = dict.get(item.category) || item.category
  const tags = useMemo(() => normalizeTags(item.tags), [item.tags])
  const showImage = !!item.image && !imgFailed
  // Linkea SIEMPRE al producto real (por su id/slug de la API). El detalle se carga data-driven.
  const detailId = item.slug || item.id || slugifyProductName(item.name)
  const resolvedDetailHref = detailHref || `/producto/${detailId}`
  const ctaLabel = t('productCard.cta', 'Ver producto')
  const articleClassName = [
    'kt-product-card group relative overflow-hidden transition-all duration-300 ease-out md:hover:-translate-y-1 md:focus-within:-translate-y-1',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={articleClassName} style={style}>
      {showDetailLink ? (
        <Link
          to={resolvedDetailHref}
          className="absolute inset-0 z-10 hidden md:block"
          aria-label={`Ver detalle de ${item.name}`}
          tabIndex={focusable ? undefined : -1}
        />
      ) : null}

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {showImage ? (
          <img
            src={item.image}
            alt={`${item.name}${item.category ? ` — ${item.category}` : ''} | Kolortec iluminación profesional`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.06] group-focus-within:scale-[1.06]"
          />
        ) : (
          // Placeholder cuando el producto no tiene imagen: bg negro + isotipo kolortec.
          <div className="absolute inset-0 flex items-center justify-center bg-deep-black">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="h-16 w-16 opacity-80" />
          </div>
        )}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.72)] to-transparent"
        />

        {item.badge ? (
          <span className="absolute right-3 top-3 bg-primary px-2 py-1 text-[11px] font-black text-[#111]">
            {item.badge}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          {category ? (
            <p className="m-0 mb-1 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-primary/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {category}
            </p>
          ) : null}

          <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[1.1rem] leading-[1.05] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors duration-300 group-hover:text-primary group-focus-within:text-primary">
            {name}
            <span className="text-primary">.</span>
          </h3>

          {tags.length > 0 ? (
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
              {tags.map((tag) => (
                <li
                  key={tag.label}
                  className="rounded-full border px-2 py-[3px] text-[0.6rem] font-bold uppercase tracking-[0.08em] backdrop-blur-[2px]"
                  style={{
                    // El color lo elige el tenant por etiqueta (BadgeSanitizer valida el hex).
                    // Sin color: chip neutro sobre la foto.
                    borderColor: tag.color ? `${tag.color}` : 'rgba(255,255,255,0.28)',
                    color: tag.color || 'rgba(255,255,255,0.82)',
                    backgroundColor: 'rgba(5,5,5,0.42)',
                  }}
                >
                  {tag.label}
                </li>
              ))}
            </ul>
          ) : null}

          {/* CTA: siempre presente en el DOM (accesible y clickeable en touch);
              en desktop aparece al hover/focus junto con el resto de la card. */}
          {showDetailLink ? (
            <Link
              to={resolvedDetailHref}
              className="kt-product-card-cta relative z-20 mt-3 inline-flex items-center gap-1.5 rounded-[6px] bg-primary px-3 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:brightness-110"
              tabIndex={focusable ? undefined : -1}
            >
              {ctaLabel}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
