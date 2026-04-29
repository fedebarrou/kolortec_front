import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function CategoryCard({ category, count }) {
  const { lang } = useLanguage()
  const displayName = lang === 'en' ? category.nameEn || category.name : category.name
  const displayDescription = lang === 'en' ? category.descriptionEn || category.description : category.description

  return (
    <Link
      to={`/tienda/${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[12px] border border-[#2a2a2a] bg-[#0f0f10] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(244,223,51,0.55)]"
      aria-label={`Ver categoria ${displayName}`}
    >
      <img
        src={category.image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.55)] to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(244,223,51,0.18) 0%, rgba(244,223,51,0.06) 38%, transparent 70%)',
        }}
      />

      {typeof count === 'number' ? (
        <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
          {count}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[clamp(1.4rem,2.4vw,1.95rem)] leading-[1.05] text-white">
          {displayName}
          <span className="text-primary">.</span>
        </h3>
        {displayDescription ? (
          <p className="mt-1 max-w-[36ch] text-[0.78rem] leading-[1.4] text-[#cfd4dc]">{displayDescription}</p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-primary opacity-0 transition group-hover:opacity-100">
          Ver productos
          <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">arrow_forward</span>
        </span>
      </div>
    </Link>
  )
}

export default CategoryCard
