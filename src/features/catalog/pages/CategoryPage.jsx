import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { defaultLandingContent } from '../../landing/data/landingData'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'
import { getCategoryBySlug, PRODUCT_CATEGORIES } from '../data/categories'

function CategoryPage() {
  const { categorySlug } = useParams()
  const { lang, t } = useLanguage()
  const [products, setProducts] = useState(defaultLandingContent.products.items)
  const [selectedBadge, setSelectedBadge] = useState('all')
  const category = getCategoryBySlug(categorySlug)
  const categoryLabel = category ? (lang === 'en' ? category.nameEn : category.name) : t('pageTitle.products', 'Productos')
  usePageTitle(categoryLabel)

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted) setProducts(response)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setSelectedBadge('all')
  }, [categorySlug])

  const categoryProducts = useMemo(
    () => products.filter((product) => product.category === categorySlug),
    [products, categorySlug],
  )

  const availableBadges = useMemo(() => {
    const unique = Array.from(
      new Set(
        categoryProducts
          .map((item) => (item.badge ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    )
    return ['all', ...unique]
  }, [categoryProducts])

  const filteredProducts = useMemo(() => {
    if (selectedBadge === 'all') return categoryProducts
    return categoryProducts.filter((item) => (item.badge ?? '').toLowerCase() === selectedBadge)
  }, [categoryProducts, selectedBadge])

  if (!category) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Categoria no encontrada
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">Esta categoria no existe en el catalogo.</p>
        <Link to="/products" className="font-bold text-primary">Volver a productos</Link>
      </section>
    )
  }

  const displayName = lang === 'en' ? category.nameEn || category.name : category.name
  const displayDescription = lang === 'en' ? category.descriptionEn || category.description : category.description

  return (
    <section className="min-h-screen bg-[#050505]">
      <div className="relative h-[clamp(220px,32vw,360px)] w-full overflow-hidden">
        <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.85)] to-[rgba(5,5,5,0.45)]" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[rgba(5,5,5,0.92)] via-[rgba(5,5,5,0.55)] to-transparent"
        />
        <div className="relative z-[1] flex h-full flex-col justify-end px-6 pb-8 lg:px-40">
          <nav className="mb-3 flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            <Link to="/products" className="transition hover:text-primary">{t('catalog.breadcrumbProducts', 'Productos')}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">{displayName}</span>
          </nav>
          <h1 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.02] drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)]">
            {displayName}
            <span className="text-primary">.</span>
          </h1>
          {displayDescription ? (
            <p className="mt-2 max-w-[60ch] text-[#cfd4dc] drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{displayDescription}</p>
          ) : null}
        </div>
      </div>

      <div className="px-6 py-[42px] lg:px-40">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </strong>
          </div>

          {availableBadges.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {availableBadges.map((badge) => {
                const label = badge === 'all' ? t('catalog.filterAll', 'Todos') : badge
                const isActive = selectedBadge === badge
                return (
                  <button
                    key={badge}
                    type="button"
                    className={`h-[34px] rounded-full border px-3 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] transition ${isActive ? 'border-[rgba(244,223,51,0.72)] bg-[rgba(244,223,51,0.13)] text-white' : 'border-[#303743] bg-transparent text-[#c8ced8] hover:border-[rgba(244,223,51,0.48)]'}`}
                    onClick={() => setSelectedBadge(badge)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-10 text-center">
            <h3 className="title-font m-0 text-[1.4rem] text-white">
              {t('catalog.emptyTitle', 'Proximamente')}
              <span className="text-primary">.</span>
            </h3>
            <p className="mx-auto mt-2 max-w-[48ch] text-[0.9rem] text-[#aeb5bf]">
              {t('catalog.emptyBody', 'Estamos sumando productos a esta categoria. Volve pronto.')}
            </p>
            <Link to="/products" className="mt-4 inline-block font-bold text-primary hover:underline">
              {t('catalog.backToCategories', 'Volver a categorias')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((item) => (
              <ProductCard
                key={`${selectedBadge}-${item.name}`}
                item={item}
                className="opacity-100"
              />
            ))}
          </div>
        )}

        <div className="mt-14 border-t border-[#2a2a2a] pt-8">
          <h2 className="title-font m-0 mb-4 text-[1.6rem] leading-[1.05]">
            {t('catalog.otherCategoriesTitle', 'Otras categorias')}
            <span className="text-primary">.</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/products/${c.slug}`}
                className="rounded-full border border-[#303743] bg-transparent px-3 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-[#c8ced8] transition hover:border-[rgba(244,223,51,0.48)] hover:text-white"
              >
                {lang === 'en' ? c.nameEn || c.name : c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryPage
