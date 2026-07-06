import { useState } from 'react'
import { Link } from 'react-router-dom'

const slugifyProductName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function ProductCard({ item, className = '', style, showDetailLink = true, detailHref }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!item.image && !imgFailed
  // Linkea SIEMPRE al producto real (por su id/slug de la API). El detalle se carga data-driven.
  const detailId = item.slug || item.id || slugifyProductName(item.name)
  const resolvedDetailHref = detailHref || `/producto/${detailId}`
  const articleClassName = [
    'group relative overflow-hidden transition-all duration-300 ease-out md:hover:-translate-y-1 md:focus-within:-translate-y-1',
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
        />
      ) : null}

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {showImage ? (
          <img
            src={item.image}
            alt={`${item.name}${item.description ? ` — ${item.description}` : ''} | Kolortec iluminación profesional`}
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
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.55)] to-transparent"
        />

        {item.badge ? (
          <span className="absolute right-3 top-3 bg-primary px-2 py-1 text-[11px] font-black text-[#111]">
            {item.badge}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[1.1rem] leading-[1.05] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors duration-300 group-hover:text-primary group-focus-within:text-primary">
            {item.name}
            <span className="text-primary">.</span>
          </h3>
          {item.description ? (
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-white/65 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
