import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import CatalogFilterBar from '../components/CatalogFilterBar'
import { defaultLandingContent } from '../../landing/data/landingData'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'
import { PRODUCT_CATEGORIES } from '../data/categories'
import { categoryMatchesFilters } from '../data/filters'

function ShopPage() {
  const { t } = useLanguage()
  usePageTitle(t('pageTitle.products', 'Productos'))
  const [products, setProducts] = useState(defaultLandingContent.products.items)
  const [searchParams] = useSearchParams()
  const [activeFilters, setActiveFilters] = useState({})
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  const isSearching = query.length > 0

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted) setProducts(response)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [query])

  const filteredProducts = useMemo(() => {
    if (!isSearching) return []
    return products.filter((item) => {
      const haystack = [item.name, item.description, item.badge]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [products, query, isSearching])

  const categoryCounts = useMemo(() => {
    const counts = {}
    products.forEach((product) => {
      if (!product.category) return
      counts[product.category] = (counts[product.category] ?? 0) + 1
    })
    return counts
  }, [products])

  const catalogTitle = t('shop.title', 'Productos')
  const catalogSubtitle = t(
    'shop.subtitle',
    'Explora nuestra linea completa con fichas tecnicas, imagenes y acceso directo al detalle de cada producto.',
  )

  if (isSearching) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <div className="mb-8 grid gap-3">
          <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {t('catalog.searchTitle', 'Resultados')}
            <span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">
            {t('catalog.searchSubtitle', 'Mostrando productos que coinciden con tu busqueda en todas las categorias.')}
          </p>
          <div className="mt-1 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            <span>{t('catalog.searchFor', 'Busqueda:')} "{query}"</span>
            <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
              {filteredProducts.length} items
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((item) => (
            <ProductCard
              key={`search-${item.name}`}
              item={item}
              className="opacity-100"
            />
          ))}

          {filteredProducts.length === 0 ? (
            <article className="rounded-[8px] border border-[#2a2a2a] bg-[#111] p-4 md:col-span-2 xl:col-span-4">
              <h3 className="title-font text-[1.35rem]">{t('catalog.noResultsTitle', 'Sin resultados')}</h3>
              <p className="text-sm text-[#c4c8ce]">{t('catalog.noResultsBody', 'No encontramos productos para esa busqueda.')}</p>
            </article>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <div className="mb-10 grid gap-3">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
          {catalogTitle}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">{catalogSubtitle}</p>
      </div>

      <CatalogFilterBar activeFilters={activeFilters} onChange={setActiveFilters} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {PRODUCT_CATEGORIES.filter((category) => categoryMatchesFilters(category, activeFilters)).map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            count={categoryCounts[category.slug] ?? 0}
          />
        ))}
        {PRODUCT_CATEGORIES.filter((category) => categoryMatchesFilters(category, activeFilters)).length === 0 ? (
          <div className="col-span-2 border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-10 text-center lg:col-span-3 xl:col-span-4">
            <h3 className="title-font m-0 text-[1.4rem] text-white">
              {t('catalog.emptyFiltersTitle', 'Sin coincidencias')}
              <span className="text-primary">.</span>
            </h3>
            <p className="mx-auto mt-2 max-w-[48ch] text-[0.9rem] text-[#aeb5bf]">
              {t('catalog.emptyFiltersBody', 'No hay categorias que cumplan con los filtros seleccionados. Probá quitando alguno.')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ShopPage
