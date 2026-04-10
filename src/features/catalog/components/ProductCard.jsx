import { Link } from 'react-router-dom'

const slugifyProductName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function ProductCard({ item, className = '', style, showDetailLink = true }) {
  const slug = slugifyProductName(item.name)
  const articleClassName = [
    'transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-within:-translate-y-0.5',
    className,
  ].filter(Boolean).join(' ')

  return (
    <article className={articleClassName} style={style}>
      <div className="relative aspect-square overflow-hidden rounded-[8px] border border-[#2a2a2a]">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 ease-out hover:scale-105"
        />
        {item.badge ? (
          <span className="absolute right-3 top-3 bg-primary px-2 py-1 text-[11px] font-black text-[#111]">
            {item.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 mb-1 title-font text-[1.35rem]">{item.name}</h3>
      <p className="m-0 text-[0.78rem] uppercase tracking-[0.14em] text-[#d7dbe2]">{item.description}</p>
      {showDetailLink ? (
        <Link className="mt-2 inline-flex text-xs font-extrabold uppercase tracking-[0.1em] text-primary" to={`/producto/${slug}`}>
          Ver detalle
        </Link>
      ) : null}
    </article>
  )
}

export default ProductCard
