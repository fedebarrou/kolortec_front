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
 * Texto legible sobre el color de la etiqueta. El color lo elige el tenant desde
 * el admin y puede ser cualquier hex: sobre el amarillo kolortec el texto tiene
 * que ser negro, sobre un azul oscuro tiene que ser blanco. Luminancia percibida
 * (ITU-R BT.601), que para un chip de 11px alcanza y sobra.
 */
function textoSobre(color) {
  const hex = String(color || '').replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  if (full.length !== 6) return '#0b0b0b'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if (![r, g, b].every(Number.isFinite)) return '#0b0b0b'
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0b0b0b' : '#f5f5f5'
}

/**
 * ProductCard — la ficha de producto de TODA la web (destacados, catálogo, línea,
 * relacionados).
 *
 * En reposo se ve la foto, las ETIQUETAS arriba a la derecha y el NOMBRE abajo.
 * Nada más. Al pasar el mouse la card crece y recién ahí aparecen la categoría y
 * el CTA: la grilla en reposo queda limpia y el detalle llega cuando lo pedís.
 *
 * Antes imprimía la `descripcion` de la DB en un renglón de 0.68rem en mayúsculas:
 * ese campo es texto libre de varias líneas cargado en el admin, así que en la
 * card salía cortado y sin relación con lo que se ve — ruido, no información.
 *
 * Las etiquetas van CUADRADAS y arriba a la derecha, en la misma esquina y con la
 * misma forma que el badge "Destacado" de siempre: son el mismo tipo de dato —una
 * marca estampada sobre la foto— y tenerlas en dos lenguajes distintos (píldoras
 * redondas abajo, un rectángulo arriba) hacía ver dos sistemas donde hay uno.
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
    // El hover (escala + z-index) vive en el CSS: una utilidad de Tailwind con
    // translate acá le ganaba al transform del escalado y se anulaban entre sí.
    'kt-product-card group relative overflow-hidden',
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

        {/* Marcas de la esquina superior derecha: primero "Destacado" (la bandera de
            la casa), después las etiquetas del tenant. Cuadradas y del mismo alto
            — una sola familia, no dos sistemas.
            En FILA: entran una al lado de la otra y sólo bajan a un segundo
            renglón cuando no queda ancho. Apiladas siempre en columna comían
            media foto en cuanto había dos o tres. `justify-end` para que el
            renglón incompleto quede pegado al borde derecho, no al izquierdo. */}
        {item.badge || tags.length > 0 ? (
          <div className="absolute right-2 top-2 z-[2] flex max-w-[85%] flex-wrap justify-end gap-1.5">
            {item.badge ? (
              <span className="bg-primary px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-[#111]">
                {item.badge}
              </span>
            ) : null}
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em]"
                style={{
                  backgroundColor: tag.color || 'rgba(10,10,10,0.82)',
                  color: tag.color ? textoSobre(tag.color) : '#f5f5f5',
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Nombre a la izquierda, "Ver producto" abajo a la DERECHA. El CTA no
              ocupa renglón propio —como botón debajo empujaba el nombre al
              aparecer y movía toda la card— y como enlace subrayado se lee como
              lo que es, sin competirle al nombre. */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[1.1rem] leading-[1.05] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors duration-300 group-hover:text-primary group-focus-within:text-primary">
                {name}
                <span className="text-primary">.</span>
              </h3>

              {/* Categoría: acompaña al CTA en el hover. En reposo, abajo va SÓLO
                  el nombre — es lo que identifica el equipo de un vistazo. */}
              {category ? (
                <p className="kt-product-card-more m-0 mt-1 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {category}
                </p>
              ) : null}
            </div>

            {showDetailLink ? (
              <Link
                to={resolvedDetailHref}
                className="kt-product-card-cta relative z-20 shrink-0 whitespace-nowrap text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-primary underline decoration-primary/60 decoration-[1.5px] underline-offset-[5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition hover:decoration-primary"
                tabIndex={focusable ? undefined : -1}
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
