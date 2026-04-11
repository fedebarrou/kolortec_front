import { Link } from 'react-router-dom'

const slugifyProductName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function ProductCard({ item, className = '', style, showDetailLink = true }) {
  const slug = slugifyProductName(item.name)
  const detailHref = `/producto/${slug}`
  const articleClassName = [
    'group relative overflow-hidden rounded-[10px] border border-[#2a2a2a] bg-[#0f0f10] transition-all duration-300 ease-out md:hover:-translate-y-1 md:hover:border-[rgba(244,223,51,0.5)] md:focus-within:-translate-y-1',
    className,
  ].filter(Boolean).join(' ')

  return (
    <article className={articleClassName} style={style}>
      {showDetailLink ? (
        <Link
          to={detailHref}
          className="absolute inset-0 z-10 hidden md:block"
          aria-label={`Ver detalle de ${item.name}`}
        />
      ) : null}

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070707f5] via-[#0707078a] to-transparent" />

        {item.badge ? (
          <span className="absolute right-3 top-3 bg-primary px-2 py-1 text-[11px] font-black text-[#111]">
            {item.badge}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <div className="rounded-[8px] border border-[rgba(255,255,255,0.16)] bg-[rgba(7,7,8,0.72)] p-3 backdrop-blur-[2px]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="min-w-0">
                <h3 className="title-font m-0 text-[1.1rem] leading-[1.02] text-[#f4f6f8]">{item.name}</h3>
                <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.12em] text-[#cfd4dc]">{item.description}</p>
              </div>
              {showDetailLink ? (
                <Link
                  to={detailHref}
                  className="relative z-20 inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-[rgba(244,223,51,0.6)] bg-[rgba(244,223,51,0.14)] text-primary transition hover:bg-primary hover:text-black"
                  aria-label={`Abrir detalle de ${item.name}`}
                >
                  <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">visibility</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
