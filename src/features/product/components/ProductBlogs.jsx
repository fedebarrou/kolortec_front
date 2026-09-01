import { Link } from 'react-router-dom'
import Rail from '../../../shared/components/Rail'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * ProductBlogs — las notas del blog ASOCIADAS a este producto.
 *
 * La relación producto ↔ post ya existe en tiendita (tabla pivote, editable desde
 * el admin) y la API la expone en /public/blog?producto_id=X. kolortec no la
 * estaba leyendo: las notas sólo se veían en la biblioteca de guías, sueltas del
 * equipo del que hablan.
 *
 * Linkea al detalle de guía (/soporte/guias/:slug), que resuelve cualquier post
 * por slug — no sólo los de tipo "guía".
 */
function ProductBlogs({ posts }) {
  const { t } = useLanguage()
  const list = Array.isArray(posts) ? posts.filter((p) => p && p.slug) : []
  if (list.length === 0) return null

  return (
    <section className="kt-detail-tech-shell kt-detail-shell-short kt-detail-anim" id="product-blogs">
      <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
        {t('productDetail.blogs.title', 'Notas relacionadas')}
        <span className="kt-title-dot">.</span>
      </h3>
      <p className="kt-detail-downloads-copy mt-4 text-[clamp(0.95rem,1.4vw,1.15rem)]">
        {t('productDetail.blogs.subtitle', 'Guías, notas técnicas y casos de uso donde aparece este equipo.')}
      </p>

      <Rail className="mt-8" label={t('productDetail.blogs.title', 'Notas relacionadas')}>
        {list.map((post) => (
          <Link key={post.slug} to={`/soporte/guias/${post.slug}`} className="kt-rail-card kt-rail-card-media kt-reveal-item">
            <span className="block aspect-[16/9] w-full overflow-hidden bg-deep-black">
              {post.image ? (
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <img src="/favicon.svg" alt="" aria-hidden="true" className="h-10 w-10 opacity-70" />
                </span>
              )}
            </span>
            <strong className="title-font px-4 pt-4 text-[1.1rem] leading-[1.12] text-[#f5f5f5]">
              {post.title}
            </strong>
            {post.excerpt ? (
              <span className="px-4 text-[0.78rem] leading-[1.45] text-[#9aa0aa] line-clamp-3">{post.excerpt}</span>
            ) : (
              <span />
            )}
            <span className="m-4 mt-0 inline-flex items-center gap-1.5 border-t border-[#2a2a2a] pt-3 text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-primary">
              {t('productDetail.blogs.cta', 'Leer nota')}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </Rail>
    </section>
  )
}

export default ProductBlogs
