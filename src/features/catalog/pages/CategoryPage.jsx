import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigationType, useParams, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { estadoOrigen } from '../../product/helpers/origenFicha.js'
import CatalogEmptyState from '../components/CatalogEmptyState'
import CatalogLoadError from '../components/CatalogLoadError'
import CatalogUnavailablePage from '../components/CatalogUnavailablePage'
import GridSkeleton, { CATALOG_GRID as GRID, CountGhost } from '../components/GridSkeleton'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { loadCategory, getCategories } from '../../../data/categories.js'
import { productTagIds, productTagOptions } from '../data/filters'
import { useScrollRestoration } from '../../../shared/hooks/useScrollRestoration'
import { useShopProducts } from '../../../shared/hooks/useShopProducts'

// Misma densidad que /products (GRID, de GridSkeleton): son el mismo objeto. Antes acá iban de a 1 por
// fila en celular (cards de 342×428 → 5.800px de scroll con 13 productos).

function CategoryPage() {
  const { categorySlug } = useParams()
  const { lang, t } = useLanguage()
  // `products === null` = cargando. Antes arrancaba con los productos DEMO del landing, así que
  // una categoría real mostraba items que no existen antes de que llegue la API.
  // `available === false` = la API de productos falló (no es «la categoría no tiene productos»).
  const { products, available: productsAvailable, retry: reintentarProductos } = useShopProducts()
  // Tanto la categoría como la etiqueta elegida se guardan JUNTO CON el slug al que
  // pertenecen y se derivan en el render. Es lo que evita el "reset" por efecto
  // (setState sincrónico dentro de useEffect → un render de más con datos de la
  // categoría anterior, que es justo cuando se colaba el parpadeo).
  // status: undefined = cargando | 'ok' | 'not-found' | 'unavailable'
  const [catState, setCatState] = useState({ slug: null, status: undefined, category: null })
  const { status, category } = catState.slug === categorySlug
    ? catState
    : { status: undefined, category: null }

  // La etiqueta elegida vive en la URL (?etiqueta=rental), no en un useState: al
  // entrar a una ficha y volver atrás, el estado local se perdía y la categoría
  // aparecía sin el filtro que habías puesto. Cambiar de etiqueta REEMPLAZA la
  // entrada del historial (replace) para que «atrás» no recorra cada clic de filtro.
  // Pasar a otra categoría cambia el path y la query se va con él: arranca en 'all'.
  const [searchParams, setSearchParams] = useSearchParams()
  const tagDeLaUrl = searchParams.get('etiqueta') || 'all'
  const setSelectedTag = (tag) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (tag === 'all') next.delete('etiqueta')
      else next.set('etiqueta', tag)
      return next
    }, { replace: true, preventScrollReset: true })
  }
  const navigationType = useNavigationType()

  // Arranca vacío (sin flash de categorías default); se llenan con las del tenant al cargar.
  const [allCategories, setAllCategories] = useState([])

  // Sube con el «Reintentar» de la pantalla «no pudimos cargar el catálogo»: vuelve a pedir la categoría y la lista de «otras».
  const [intentoCat, setIntentoCat] = useState(0)
  useEffect(() => {
    let mounted = true
    loadCategory(categorySlug).then((res) => {
      if (mounted) setCatState({ slug: categorySlug, ...res })
    })
    getCategories().then((list) => {
      if (mounted && Array.isArray(list) && list.length) setAllCategories(list)
    })
    return () => { mounted = false }
  }, [categorySlug, intentoCat])

  const reintentar = () => {
    setCatState({ slug: null, status: undefined, category: null })
    setIntentoCat((n) => n + 1)
    reintentarProductos()
  }

  // Arriba de todo al ENTRAR a una categoría; al volver atrás (POP) no: ahí manda
  // el scroll guardado de esa entrada (useScrollRestoration, más abajo).
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al cambiar de categoría
  }, [categorySlug])

  const categoryProducts = useMemo(
    () => (products ?? []).filter((product) => product.category === categorySlug),
    [products, categorySlug],
  )

  /**
   * Filtro por ETIQUETA, no por `badge`.
   *
   * Se armaba con `item.badge`, que el adapter sólo llena con 'Destacado' cuando
   * el producto está destacado: 0 de 57 lo están, así que el filtro no aparecía
   * NUNCA. Mientras tanto las cards muestran READY TO WORK / RENTAL, que viven en
   * `item.tags` y no se ofrecían. Ahora se ofrece lo que se ve.
   */
  const availableTags = useMemo(() => {
    const porId = new Map()
    // `productTagOptions` devuelve id y label YA emparejados (antes eran dos listas con filtros distintos,
    // alineadas por índice: una etiqueta descartada en una sola corría todos los labels que seguían).
    categoryProducts.forEach((item) => {
      productTagOptions(item).forEach(({ id, label }) => { if (!porId.has(id)) porId.set(id, label) })
    })
    return [...porId.entries()].map(([id, label]) => ({ id, label }))
  }, [categoryProducts])

  // Una etiqueta de la URL que esta categoría no tiene (link viejo o escrito a mano) cae a «Todos»:
  // si no, la lista quedaba vacía y ningún botón marcado.
  const selectedTag = tagDeLaUrl !== 'all' && availableTags.some((tag) => tag.id === tagDeLaUrl) ? tagDeLaUrl : 'all'

  const filteredProducts = useMemo(() => {
    if (selectedTag === 'all') return categoryProducts
    return categoryProducts.filter((item) => productTagIds(item).includes(selectedTag))
  }, [categoryProducts, selectedTag])

  const productsLoading = products === null
  useScrollRestoration(status === 'ok' && !productsLoading, categorySlug)
  // Las cards llevan en el state de qué categoría vienen: la flecha «volver» de la ficha vuelve por el
  // historial (con ?etiqueta= y scroll) sólo si la página anterior es la categoría del producto.
  const origenFicha = estadoOrigen(categorySlug)

  if (status === undefined) {
    // Cargando la categoría desde la API: no se parpadea «no encontrada» ni se deja la pantalla negra; se dibuja el hero
    // y la grilla fantasma (el mismo alto que los reales, así la página no salta cuando llegan los datos).
    return (
      <section className="min-h-screen bg-[color:var(--bg)]" aria-busy="true">
        <GridSkeleton header="category" />
      </section>
    )
  }

  // 'unavailable' ≠ 'not-found': si no pudimos traer la lista de categorías, no
  // podemos afirmar que ESTA no exista. Antes las dos daban el mismo 404 duro, así
  // que una caída de /public/categorias convertía una categoría real en inexistente.
  if (status !== 'ok') {
    // Una sola página de catálogo sin contenido (CatalogUnavailablePage): caída (con Reintentar) o «no encontrada».
    return (
      <CatalogUnavailablePage
        path={`/products/${categorySlug || ''}`}
        variant={status === 'unavailable' ? 'unavailable' : 'category-not-found'}
        kind="categories"
        onRetry={reintentar}
      />
    )
  }

  const displayName = lang === 'en' ? category.nameEn || category.name : category.name
  const displayDescription = lang === 'en' ? category.descriptionEn || category.description : category.description

  return (
    <section className="min-h-screen bg-[color:var(--bg)]">
      <Seo
        title={category.seoTitle}
        description={category.seoDescription}
        path={`/products/${category.slug}`}
        image={category.ogImage}
      />
      {/* Las fotos de categoría son VERTICALES (1547×1920) y entraban en una banda
          de 270px con `cover`: se veía el 15% de la imagen.
          Dos tramos porque `vw` no sabe del lienzo: abajo de 1024 el ancho real es
          el del teléfono, pero de 1024 para arriba TODO vive en `.kt-zoom-canvas`,
          un lienzo fijo de 1920px que después se escala — ahí un alto en `vw`
          achica el hero justo cuando la foto es más ancha. Fijo en 520px del
          lienzo: pasa a verse el ~22% y el h1 deja de estar apretado contra el
          borde. */}
      <div className="relative h-[clamp(240px,52vw,360px)] w-full overflow-hidden bg-deep-black lg:h-[520px]">
        <CategoryHeroImage src={category.image} alt={`${displayName} - Iluminación profesional Kolortec`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.85)] to-[rgba(5,5,5,0.45)]" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[rgba(5,5,5,0.92)] via-[rgba(5,5,5,0.55)] to-transparent"
        />
        <div className="relative z-[1] flex h-full flex-col justify-end px-6 pb-8 lg:px-40 kt-reveal">
          <nav className="mb-3 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            <Link to="/products" className="transition hover:text-primary">{t('catalog.breadcrumbProducts', 'Productos')}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">{displayName}</span>
          </nav>
          <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.02] drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)]">
            {displayName}
            <span className="text-primary">.</span>
          </h1>
          {displayDescription ? (
            <p className="mt-2 max-w-[60ch] text-[#cfd4dc] drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">{displayDescription}</p>
          ) : null}
        </div>
      </div>

      <div className="px-6 py-[42px] lg:px-40">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center kt-reveal">
          <div className="inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            {productsLoading ? (
              <CountGhost />
            ) : !productsAvailable ? (
              <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">{' '}</strong>
            ) : (
              <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </strong>
            )}
          </div>

          {/* Con UNA sola etiqueta el filtro no filtra nada (elegirla devuelve todo):
              se ofrece a partir de dos. */}
          {!productsLoading && availableTags.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {[{ id: 'all', label: t('catalog.filterAll', 'Todos') }, ...availableTags].map((tag) => {
                const isActive = selectedTag === tag.id
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] transition ${isActive ? 'border-[rgba(244,223,51,0.72)] bg-[rgba(244,223,51,0.13)] text-white' : 'border-[#303743] bg-transparent text-[#c8ced8] hover:border-[rgba(244,223,51,0.48)]'}`}
                    aria-pressed={isActive}
                    onClick={() => setSelectedTag(tag.id)}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Cargando ≠ vacío. Sin esta distinción una categoría con 13 productos
            anunciaba "0 ITEMS · PRÓXIMAMENTE" durante toda la carga. */}
        {productsLoading ? (
          <GridSkeleton className="kt-reveal" />
        ) : !productsAvailable ? (
          // La API de productos falló: no es «Próximamente» ni «0 items». Mismo estado que /products.
          <CatalogLoadError className="kt-reveal" onRetry={reintentarProductos} />
        ) : filteredProducts.length === 0 ? (
          <CatalogEmptyState
            className="kt-reveal"
            title={
              categoryProducts.length === 0
                ? t('catalog.emptyTitle', 'Próximamente')
                : t('catalog.emptyFiltersTitle', 'Sin coincidencias')
            }
            body={
              categoryProducts.length === 0
                ? t('catalog.emptyBody', 'Estamos sumando productos a esta categoría. Volvé pronto.')
                : t('catalog.emptyTagBody', 'Ningún producto de esta categoría tiene esa etiqueta.')
            }
            action={
              categoryProducts.length === 0 ? (
                <Link to="/products" className="font-bold text-primary hover:underline">
                  {t('catalog.backToCategories', 'Volver a categorías')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className="font-bold text-primary hover:underline"
                >
                  {t('catalog.filterAll', 'Todos')}
                </button>
              )
            }
          />
        ) : (
          <div className={`${GRID} kt-reveal`}>
            {filteredProducts.map((item, index) => (
              <ProductCard
                key={item.id ?? item.slug ?? `${item.name}-${index}`}
                item={item}
                origen={origenFicha}
                className="opacity-100"
              />
            ))}
          </div>
        )}

        <div className="mt-14 border-t border-[#2a2a2a] pt-8 kt-reveal">
          <h2 className="title-font m-0 mb-4 text-[1.6rem] leading-[1.05]">
            {t('catalog.otherCategoriesTitle', 'Otras categorías')}
            <span className="text-primary">.</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {allCategories.filter((c) => c.slug !== category.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/products/${c.slug}`}
                /* Mismo lenguaje que las etiquetas de la card (ProductCard):
                   rectangulares, 12px, font-black, mayúsculas y tracking .06 —
                   la píldora con borde no se parecía a nada más del sitio.
                   En reposo usa el fondo de una etiqueta común y al pasar por
                   encima pasa al amarillo del badge destacado, que es el otro
                   estado que ya existe en la card.
                   `min-h-[40px]`: la forma rectangular se queda, pero medían
                   24.5px de alto y son un destino táctil. */
                className="inline-flex min-h-[40px] items-center bg-[#1b212b] px-3 text-[12px] font-black uppercase tracking-[0.06em] text-[#c8ced8] transition hover:bg-primary hover:text-[#111]"
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

/**
 * Hero de la categoría. La foto puede faltar (`image_url: null` en la API) o
 * romperse: sin esto quedaba un <img> roto con el alt impreso encima del negro.
 */
function CategoryHeroImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

export default CategoryPage
