import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function CategoryCard({ category, count }) {
  const { lang } = useLanguage()
  const displayName = lang === 'en' ? category.nameEn || category.name : category.name

  return (
    <Link
      to={`/products/${category.slug}`}
      className="group relative block aspect-square overflow-hidden border border-[#1f1f22] bg-[#0a0a0a] transition-colors duration-300 hover:border-primary/55 focus-visible:border-primary/55 focus-visible:outline-none"
      aria-label={`Ver categoria ${displayName}`}
    >
      <img
        src={category.image}
        alt={`Categoría ${displayName} - Iluminación profesional Kolortec`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale-[35%] transition-all duration-500 ease-out group-hover:scale-[1.05] group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[rgba(8,8,10,0.55)] transition-opacity duration-500 group-hover:bg-[rgba(8,8,10,0.18)] group-focus-visible:bg-[rgba(8,8,10,0.18)]"
      />

      {typeof count === 'number' && count > 0 ? (
        <span className="absolute right-3 top-3 z-10 text-[10px] font-extrabold tracking-[0.18em] text-white/65">
          {String(count).padStart(2, '0')}
        </span>
      ) : null}

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-5">
        <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-center text-[clamp(1rem,1.6vw,1.4rem)] uppercase leading-[1.1] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
          {displayName}
          <span className="text-primary">.</span>
        </h3>
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full group-focus-visible:w-full"
      />

      <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        Ver →
      </span>
    </Link>
  )
}

export default CategoryCard
