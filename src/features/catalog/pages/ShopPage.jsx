import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import CatalogFilterBar from '../components/CatalogFilterBar'
import CatalogEmptyState from '../components/CatalogEmptyState'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { loadCategories } from '../../../data/categories.js'
import {
  FILTER_AXES,
  countActiveFilters,
  productMatchesFilters,
  syncFilterAxes,
} from '../data/filters'

// Grilla del catálogo: la MISMA densidad para productos y para categorías. Son el
// mismo tipo de objeto (una foto cuadrada con un nombre) y estaban de a 1 por fila
// los productos y de a 2 las categorías. El escalón `lg` faltaba: entre 768 y 1279
// la grilla se quedaba clavada en 2 columnas.
const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'
const GRID_FULL_ROW = 'col-span-2 lg:col-span-3 xl:col-span-4'

function ShopPage() {
  const { t } = useLanguage()
  // null = todavía cargando. Antes arrancaba con `defaultLandingContent.products.items`
  // y el buscador filtraba sobre ESO: "?q=spot" devolvía "PRECISION SPOT Z4" y
  // "KT-SPOT S5", productos DEMO que no existen en la cuenta, con CTA a fichas
  // inexistentes. Mismo criterio que ya se tomó para las categorías: no se muestra
  // data fantasma, se muestra "cargando".
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState(null)
  const [catsAvailable, setCatsAvailable] = useState(true)
  const [searchParams] = useSearchParams()
  const [activeFilters, setActiveFilters] = useState({})
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  const isSearching = query.length > 0

  // Los ejes de la barra se derivan de los datos reales y `CatalogFilterBar` los lee
  // del módulo (ver data/filters.js). Hay que sincronizarlos JUNTO con el setState
  // que dispara el re-render, no en un efecto posterior, o la barra pinta los ejes
  // viejos hasta el próximo render.
  const datos = useRef({ categories: [], products: [] })

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (!mounted) return
      const list = Array.isArray(response) ? response : []
      datos.current = { ...datos.current, products: list }
      syncFilterAxes(datos.current)
      setProducts(list)
    })
    loadCategories().then(({ list, available }) => {
      if (!mounted) return
      datos.current = { ...datos.current, categories: list }
      syncFilterAxes(datos.current)
      setCatsAvailable(available)
      setCategories(list)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [query])

  const catsLoading = categories === null
  const productsLoading = products === null
  const activeCount = countActiveFilters(activeFilters)
  const hasFilterBar = FILTER_AXES.length > 0

  const filteredProducts = useMemo(() => {
    if (!isSearching || !products) return []
    return products.filter((item) => {
      const haystack = [item.name, item.description, item.badge]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [products, query, isSearching])

  // Con filtros activos la página muestra PRODUCTOS, no categorías: filtrar por
  // etiqueta ("Rental") no se puede expresar como "qué categorías quedan", y quien
  // elige "Cabezal movil" quiere ver los cabezales, no una card que dice Cabezal
  // movil. Sin filtros, la vista de entrada sigue siendo la grilla de categorías.
  const matchingProducts = useMemo(() => {
    if (activeCount === 0 || !products) return []
    return products.filter((item) => productMatchesFilters(item, activeFilters))
  }, [products, activeFilters, activeCount])

  const categoryCounts = useMemo(() => {
    const counts = {}
    ;(products ?? []).forEach((product) => {
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
  const volverALista = (
    <Link to="/products" className="font-bold text-primary hover:underline">
      {t('catalog.backToCategories', 'Volver a categorias')}
    </Link>
  )

  if (isSearching) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <Seo
          title={`Búsqueda: ${query} · Productos Kolortec`}
          description={t('seo.shopSearchDesc', 'Buscador del catálogo Kolortec. Cabezales móviles, strobes y paneles LED de línea propia con soporte local.')}
          path="/products"
          noindex
        />
        <div className="mb-8 grid gap-3 kt-reveal">
          <h1 className="title-font m-0 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {t('catalog.searchTitle', 'Resultados')}
            <span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">
            {t('catalog.searchSubtitle', 'Mostrando productos que coinciden con tu busqueda en todas las categorias.')}
          </p>
          <div className="mt-1 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            <span>{t('catalog.searchFor', 'Busqueda:')} "{query}"</span>
            {productsLoading ? (
              <strong className="animate-pulse text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
                {t('catalog.loadingProducts', 'Buscando…')}
              </strong>
            ) : (
              <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
                {filteredProducts.length} items
              </strong>
            )}
          </div>
        </div>

        <div className={`${GRID} kt-reveal`}>
          {productsLoading ? <GridLoading label={t('catalog.loadingProducts', 'Buscando…')} /> : null}

          {!productsLoading && filteredProducts.map((item, index) => (
            <ProductCard
              key={item.id ?? item.slug ?? `${item.name}-${index}`}
              item={item}
              className="opacity-100"
            />
          ))}

          {!productsLoading && filteredProducts.length === 0 ? (
            <CatalogEmptyState
              className={GRID_FULL_ROW}
              title={t('catalog.noResultsTitle', 'Sin resultados')}
              body={t('catalog.noResultsBody', 'No encontramos productos para esa busqueda.')}
              action={volverALista}
            />
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <Seo
        title={t('seo.shopTitle', 'Productos · Iluminación profesional Kolortec')}
        description={t('seo.shopDesc', 'Cabezales móviles, strobes y paneles LED de línea propia, testeados y listos para escena. Durabilidad y soporte de fábrica.')}
        path="/products"
      />
      <div className="mb-10 grid gap-3 kt-reveal">
        <h1 className="title-font m-0 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
          {catalogTitle}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">{catalogSubtitle}</p>
      </div>

      {/* La barra sólo aparece cuando hay algo real que ofrecer: sin datos no se
          dibuja un control muerto. */}
      {hasFilterBar ? (
        <CatalogFilterBar activeFilters={activeFilters} onChange={setActiveFilters} />
      ) : null}

      {activeCount > 0 ? (
        <div className="mb-4 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af] kt-reveal">
          <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
            {matchingProducts.length} {matchingProducts.length === 1 ? 'item' : 'items'}
          </strong>
        </div>
      ) : null}

      <div className={`${GRID} kt-reveal`}>
        {activeCount > 0 ? (
          <>
            {productsLoading ? <GridLoading label={t('catalog.loadingProducts', 'Cargando productos…')} /> : null}
            {!productsLoading && matchingProducts.map((item, index) => (
              <ProductCard
                key={item.id ?? item.slug ?? `${item.name}-${index}`}
                item={item}
                className="opacity-100"
              />
            ))}
            {!productsLoading && matchingProducts.length === 0 ? (
              <CatalogEmptyState
                className={GRID_FULL_ROW}
                title={t('catalog.emptyFiltersTitle', 'Sin coincidencias')}
                /* Clave NUEVA a propósito: `catalog.emptyFiltersBody` dice "no hay
                   CATEGORIAS que cumplan…", y con filtros activos esta grilla
                   muestra productos. Falta cargarla en translations.js (ver informe). */
                body={t('catalog.emptyFiltersProductsBody', 'Ningun producto cumple con los filtros seleccionados. Proba quitando alguno.')}
                action={
                  <button
                    type="button"
                    onClick={() => setActiveFilters({})}
                    className="font-bold text-primary hover:underline"
                  >
                    {t('catalog.filterClearAll', 'Limpiar todos')}
                  </button>
                }
              />
            ) : null}
          </>
        ) : (
          <>
            {catsLoading ? <GridLoading label={t('catalog.loadingCategories', 'Cargando categorías…')} /> : null}
            {!catsLoading && categories.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                count={categoryCounts[category.slug] ?? 0}
              />
            ))}
            {/* Sin filtros activos NO se puede decir "no hay categorías que cumplan
                con los filtros seleccionados": no hay ninguno. Si la lista vino
                vacía, lo único cierto es que no la tenemos. */}
            {!catsLoading && categories.length === 0 ? (
              <CatalogEmptyState
                className={GRID_FULL_ROW}
                title={
                  catsAvailable
                    ? t('catalog.noCategoriesTitle', 'Catalogo en preparacion')
                    : t('catalog.categoriesUnavailableTitle', 'No pudimos cargar el catalogo')
                }
                body={
                  catsAvailable
                    ? t('catalog.noCategoriesBody', 'Todavia no hay categorias publicadas.')
                    : t('catalog.categoriesUnavailableBody', 'Hubo un problema al traer las categorias. Proba recargar la pagina en un momento.')
                }
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function GridLoading({ label }) {
  return (
    <div className={`${GRID_FULL_ROW} flex items-center justify-center py-16 text-sm text-[#8b90a0]`}>
      <span className="animate-pulse">{label}</span>
    </div>
  )
}

export default ShopPage
