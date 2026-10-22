import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import CatalogFilterBar from '../components/CatalogFilterBar'
import CatalogEmptyState from '../components/CatalogEmptyState'
import CatalogLoadError, { CatalogInlineNotice } from '../components/CatalogLoadError'
import GridSkeleton, { CATALOG_GRID as GRID, FilterBarGhost } from '../components/GridSkeleton'
import { loadShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { loadCategories } from '../../../data/categories.js'
import {
  FILTER_AXES,
  countActiveFilters,
  normalizeSearch,
  productMatchesFilters,
  productMatchesQuery,
  sanitizeFilters,
  syncFilterAxes,
} from '../data/filters'
import { useScrollRestoration } from '../../../shared/hooks/useScrollRestoration'

// Grilla del catálogo (GRID, de GridSkeleton): la MISMA densidad para productos y para categorías. Son el
// mismo tipo de objeto (una foto cuadrada con un nombre) y estaban de a 1 por fila
// los productos y de a 2 las categorías. El escalón `lg` faltaba: entre 768 y 1279
// la grilla se quedaba clavada en 2 columnas.
const GRID_FULL_ROW = 'col-span-2 lg:col-span-3 xl:col-span-4'

// Los filtros viven en la URL (?categoria=a,b&etiqueta=x), no en un useState: al
// abrir un producto filtrado y volver atrás, el estado local se perdía y la página
// caía en la grilla de categorías sin filtros.
const FILTER_KEYS = ['categoria', 'etiqueta']

function filtersFromParams(params) {
  const out = {}
  FILTER_KEYS.forEach((key) => {
    const ids = (params.get(key) || '').split(',').map((v) => v.trim()).filter(Boolean)
    if (ids.length) out[key] = ids
  })
  return out
}

function ShopPage() {
  const { t } = useLanguage()
  // null = todavía cargando. Antes arrancaba con `defaultLandingContent.products.items`
  // y el buscador filtraba sobre ESO: "?q=spot" devolvía "PRECISION SPOT Z4" y
  // "KT-SPOT S5", productos DEMO que no existen en la cuenta, con CTA a fichas
  // inexistentes. Mismo criterio que ya se tomó para las categorías: no se muestra
  // data fantasma, se muestra "cargando".
  const [products, setProducts] = useState(null)
  // available=false: la API de productos falló (no es lo mismo que «la cuenta no tiene productos»).
  // Mismo patrón que `catsAvailable`: sin distinguirlos, una búsqueda con la API caída decía «Sin resultados».
  const [productsAvailable, setProductsAvailable] = useState(true)
  const [reintento, setReintento] = useState(0)
  const [categories, setCategories] = useState(null)
  const [catsAvailable, setCatsAvailable] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const filtrosEnUrl = FILTER_KEYS.map((k) => searchParams.get(k) || '').join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- la firma de texto evita un objeto nuevo por render
  const filtrosDeLaUrl = useMemo(() => filtersFromParams(searchParams), [filtrosEnUrl])
  // Reemplaza la entrada (no la apila): «atrás» no recorre cada clic de filtro, y
  // la URL que queda es la que se restaura al volver de una ficha.
  const setActiveFilters = (next) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      FILTER_KEYS.forEach((key) => {
        const ids = next?.[key] ?? []
        if (ids.length) params.set(key, ids.join(','))
        else params.delete(key)
      })
      return params
    }, { replace: true, preventScrollReset: true })
  }
  const navigationType = useNavigationType()
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  // Una búsqueda de puros símbolos («%», «"», un emoji) no busca nada: se normaliza igual que
  // `productMatchesQuery`, que la ve vacía y devolvería TODO el catálogo bajo un «Búsqueda: "%"».
  const isSearching = normalizeSearch(query).length > 0

  // Los ejes de la barra se derivan de los datos reales y `CatalogFilterBar` los lee
  // del módulo (ver data/filters.js). Hay que sincronizarlos JUNTO con el setState
  // que dispara el re-render, no en un efecto posterior, o la barra pinta los ejes
  // viejos hasta el próximo render.
  const datos = useRef({ categories: [], products: [] })

  useEffect(() => {
    let mounted = true
    loadShopProducts().then(({ list, available }) => {
      if (!mounted) return
      datos.current = { ...datos.current, products: list }
      syncFilterAxes(datos.current)
      setProductsAvailable(available)
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
  }, [reintento])

  // Arriba al entrar o al cambiar la búsqueda; al volver atrás (POP), no: manda el
  // scroll guardado de esa entrada.
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al cambiar la búsqueda
  }, [query])

  const reintentarProductos = () => {
    setProducts(null)
    setReintento((n) => n + 1)
  }
  // Reintentar de la lista de categorías: vuelve a pedirlas (la grilla pasa a «cargando»). El efecto pide también los
  // productos, que ya están en memoria o se piden de nuevo: da lo mismo.
  const reintentarCategorias = () => {
    setCategories(null)
    setReintento((n) => n + 1)
  }

  const catsLoading = categories === null
  const productsLoading = products === null
  useScrollRestoration(!catsLoading && !productsLoading, query)
  // Valores de la URL que la barra no ofrece (?etiqueta=xyz, ?categoria=inventada) se ignoran, como hace
  // CategoryPage con su etiqueta: si no, la lista quedaba en «Sin coincidencias» sin nada marcado. Mientras
  // carga no se sabe qué existe, así que se respeta lo que viene (se ve «cargando», no la grilla de categorías).
  const activeFilters = useMemo(
    () => (productsLoading || catsLoading ? filtrosDeLaUrl : sanitizeFilters(filtrosDeLaUrl, FILTER_AXES)),
    // FILTER_AXES se reasigna en el efecto de carga, antes de los setState de products/categories.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtrosDeLaUrl, productsLoading, catsLoading, products, categories],
  )
  const activeCount = countActiveFilters(activeFilters)
  const hasFilterBar = FILTER_AXES.length > 0
  // Con búsqueda o con filtros activos la página muestra PRODUCTOS, no categorías: filtrar por
  // etiqueta ("Rental") no se puede expresar como "qué categorías quedan", y quien elige "Cabezal
  // movil" quiere ver los cabezales, no una card que dice Cabezal movil. Sin ninguno de los dos, la
  // vista de entrada sigue siendo la grilla de categorías.
  const showingProducts = isSearching || activeCount > 0

  // La búsqueda se COMBINA con los filtros (AND): «movil» + etiqueta Rental = cabezales con Rental.
  const matchingProducts = useMemo(() => {
    if (!showingProducts || !products) return []
    return products.filter(
      (item) => (!isSearching || productMatchesQuery(item, query, categories ?? []))
        && (activeCount === 0 || productMatchesFilters(item, activeFilters)),
    )
  }, [products, categories, query, isSearching, activeFilters, activeCount, showingProducts])

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
    'Explorá nuestra línea completa con fichas técnicas, imágenes y acceso directo al detalle de cada producto.',
  )
  const volverALista = (
    <Link to="/products" className="font-bold text-primary hover:underline">
      {t('catalog.backToCategories', 'Volver a categorías')}
    </Link>
  )
  const limpiarFiltros = (
    <button
      type="button"
      onClick={() => setActiveFilters({})}
      className="font-bold text-primary hover:underline"
    >
      {t('catalog.filterClearAll', 'Limpiar todos')}
    </button>
  )

  return (
    <section className="min-h-screen bg-[color:var(--bg)] px-6 py-[42px] lg:px-40">
      {isSearching ? (
        <Seo
          title={`Búsqueda: ${query} · Productos Kolortec`}
          description={t('seo.shopSearchDesc', 'Buscador del catálogo Kolortec. Cabezales móviles, strobes y paneles LED de línea propia con soporte local.')}
          path="/products"
          noindex
        />
      ) : (
        <Seo
          title={t('seo.shopTitle', 'Productos · Iluminación profesional Kolortec')}
          description={t('seo.shopDesc', 'Cabezales móviles, strobes y paneles LED de línea propia, testeados y listos para escena. Durabilidad y soporte de fábrica.')}
          path="/products"
        />
      )}

      {isSearching ? (
        <div className="mb-10 grid gap-3 kt-reveal">
          <h1 className="title-font m-0 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {t('catalog.searchTitle', 'Resultados')}
            <span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">
            {t('catalog.searchSubtitle', 'Mostrando productos que coinciden con tu búsqueda en todas las categorías.')}
          </p>
          <div className="mt-1 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            <span>{t('catalog.searchFor', 'Búsqueda:')} "{query}"</span>
            {productsLoading ? (
              <strong className="animate-pulse text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
                {t('catalog.searching', 'Buscando…')}
              </strong>
            ) : productsAvailable ? (
              <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
                {matchingProducts.length} items
              </strong>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mb-10 grid gap-3 kt-reveal">
          <h1 className="title-font m-0 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {catalogTitle}
            <span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">{catalogSubtitle}</p>
        </div>
      )}

      {/* La barra sólo aparece cuando hay algo real que ofrecer: sin datos no se
          dibuja un control muerto. También con búsqueda: se combinan. */}
      {/* Mientras cargan los datos se reserva su lugar (FilterBarGhost): sus ejes salen de los productos y las categorías,
          y dibujarla recién al llegar empujaba la grilla hacia abajo. */}
      {productsLoading || catsLoading ? (
        <FilterBarGhost />
      ) : hasFilterBar ? (
        <CatalogFilterBar activeFilters={activeFilters} onChange={setActiveFilters} />
      ) : null}

      {activeCount > 0 && !isSearching ? (
        <div className="mb-4 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af] kt-reveal">
          <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
            {matchingProducts.length} {matchingProducts.length === 1 ? 'item' : 'items'}
          </strong>
        </div>
      ) : null}

      {/* Sin búsqueda ni filtros la página es la grilla de categorías, y cada card cuenta sus productos. Si los productos
          fallaron, las categorías siguen ahí (no hace falta tirarlas) pero los conteos no valen: un aviso de una línea,
          arriba de la grilla, con Reintentar. Con búsqueda o filtros el error es el de la grilla de productos. */}
      {!showingProducts && !catsLoading && categories.length > 0 && !productsLoading && !productsAvailable ? (
        <CatalogInlineNotice className="mb-4" onRetry={reintentarProductos}>
          {t('catalog.countsUnavailable', 'No pudimos contar los productos.')}
        </CatalogInlineNotice>
      ) : null}

      <div className={`${GRID} kt-reveal`}>
        {showingProducts ? (
          <>
            {productsLoading
              ? <GridSkeleton className={GRID_FULL_ROW} label={isSearching ? t('catalog.searching', 'Buscando…') : t('catalog.loadingProducts', 'Cargando productos…')} />
              : null}
            {!productsLoading && matchingProducts.map((item, index) => (
              <ProductCard
                key={item.id ?? item.slug ?? `${item.name}-${index}`}
                item={item}
                className="opacity-100"
              />
            ))}
            {!productsLoading && !productsAvailable ? (
              <CatalogLoadError className={GRID_FULL_ROW} onRetry={reintentarProductos} />
            ) : null}
            {!productsLoading && productsAvailable && matchingProducts.length === 0 ? (
              isSearching && activeCount === 0 ? (
                <CatalogEmptyState
                  className={GRID_FULL_ROW}
                  title={t('catalog.noResultsTitle', 'Sin resultados')}
                  body={t('catalog.noResultsBody', 'No encontramos productos para esa búsqueda.')}
                  action={volverALista}
                />
              ) : (
                <CatalogEmptyState
                  className={GRID_FULL_ROW}
                  title={t('catalog.emptyFiltersTitle', 'Sin coincidencias')}
                  /* Clave NUEVA a propósito: `catalog.emptyFiltersBody` dice "no hay
                     CATEGORIAS que cumplan…", y con filtros activos esta grilla
                     muestra productos. Falta cargarla en translations.js (ver informe). */
                  body={t('catalog.emptyFiltersProductsBody', 'Ningún producto cumple con los filtros seleccionados. Probá quitando alguno.')}
                  action={limpiarFiltros}
                />
              )
            ) : null}
          </>
        ) : (
          <>
            {catsLoading ? <GridSkeleton ratio="square" className={GRID_FULL_ROW} label={t('catalog.loadingCategories', 'Cargando categorías…')} /> : null}
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
            {/* Sin la lista: el MISMO estado de error del resto del catálogo (CatalogLoadError), con Reintentar. */}
            {!catsLoading && categories.length === 0 && !catsAvailable ? (
              <CatalogLoadError className={GRID_FULL_ROW} kind="categories" onRetry={reintentarCategorias} />
            ) : null}
            {!catsLoading && categories.length === 0 && catsAvailable ? (
              <CatalogEmptyState
                className={GRID_FULL_ROW}
                title={t('catalog.noCategoriesTitle', 'Catálogo en preparación')}
                body={t('catalog.noCategoriesBody', 'Todavía no hay categorías publicadas.')}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

export default ShopPage
