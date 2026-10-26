import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigationType, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CatalogEmptyState from '../components/CatalogEmptyState'
import CatalogUnavailablePage from '../components/CatalogUnavailablePage'
import GridSkeleton, { CATALOG_GRID as GRID } from '../components/GridSkeleton'
import { linesFromProducts, slugifyLinea } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { loadCategories } from '../../../data/categories.js'
import { useScrollRestoration } from '../../../shared/hooks/useScrollRestoration'
import { useShopProducts } from '../../../shared/hooks/useShopProducts'

/**
 * LinePage — todos los productos de UNA línea, en su propia URL.
 *
 * Existe para tener a dónde apuntar: los accesos del hero y del scrolltelling
 * guardan un `href` de texto libre, así que con esta ruta un botón puede llevar
 * a "Golden Line" igual que hoy lleva a una categoría. Sin la ruta no había
 * ningún destino para una línea.
 *
 * A diferencia de una categoría, una línea NO es una entidad: es un campo libre
 * del producto (`linea`) que el admin completa a mano. Por eso acá no hay foto
 * de portada ni descripción — no existen — y el slug se deriva del nombre con
 * `slugifyLinea`, que es la única fuente para las dos puntas: si esta página
 * slugificara distinto de quien arma el link, el acceso apuntaría a la nada.
 *
 * HOY LOS 57 PRODUCTOS TIENEN `linea` VACÍA, así que `getLines()` devuelve [] y
 * cualquier /linea/x caía en "no encontrada" — incluida "Golden Line", que en
 * esta cuenta existe pero cargada como CATEGORÍA (`/products/golden-line`).
 *
 * Decisión: antes de dar 404, buscar una CATEGORÍA con el mismo slug y redirigir
 * con `replace`. Es lo único que no inventa datos: no se deriva una taxonomía
 * paralela desde otro campo (sería fabricar líneas que nadie cargó) ni se deja el
 * link del hero apuntando a la nada. La página sigue viva para el día en que el
 * admin cargue `linea` de verdad; mientras tanto /linea/golden-line lleva a los 5
 * productos reales. /linea nunca estuvo en el sitemap, así que no hay nada que
 * sacar de ahí.
 */
function LinePage() {
  const { lineSlug } = useParams()
  const { t } = useLanguage()
  // `products === null` = cargando (no []: con [] se anunciaba «0 items · Próximamente» durante toda la carga).
  // `available === false` = la API de productos falló: NO es «esta línea no existe» (con getShopProducts() un 500 y una
  // cuenta vacía daban lo mismo, y /linea/x decía «Línea no encontrada» con el servidor caído).
  const { products, available, retry, intento } = useShopProducts()
  // cats: undefined = cargando (hace falta ANTES de decir «no existe»: un slug puede ser una categoría).
  // { slugs, available }: available=false = no se pudo traer la lista de categorías.
  const [cats, setCats] = useState(undefined)

  useEffect(() => {
    let mounted = true
    loadCategories().then(({ list, available: catsAvailable }) => {
      if (mounted) setCats({ slugs: new Set(list.map((c) => c.slug)), available: catsAvailable })
    })
    return () => { mounted = false }
  }, [intento])

  const reintentar = () => {
    setCats(undefined)
    retry()
  }

  // Arriba de todo al ENTRAR a una línea; al volver atrás (POP) no: ahí manda el scroll guardado de
  // esa entrada (useScrollRestoration, más abajo). Mismo criterio que CategoryPage.
  const navigationType = useNavigationType()
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al cambiar de línea
  }, [lineSlug])
  const cargando = products === null || cats === undefined
  useScrollRestoration(!cargando, lineSlug)

  // Las líneas salen de los MISMOS productos que se listan: una sola fuente, un solo estado de carga.
  const lines = useMemo(() => linesFromProducts(products), [products])
  const line = useMemo(
    () => lines.find((l) => l.slug === lineSlug) ?? null,
    [lines, lineSlug],
  )

  const lineProducts = useMemo(
    () => (products ?? []).filter((p) => p.line && slugifyLinea(p.line) === lineSlug),
    [products, lineSlug],
  )

  // Cargando: no se sabe todavía si la línea existe (ni cómo se llama), así que no se dibuja ni «no encontrada» ni el
  // título; sí el esqueleto con el encabezado fantasma (el mismo alto que el real: la grilla no salta al llegar los
  // datos). Una sección vacía dejaba la pantalla negra todo el tiempo que tardaba la API.
  if (cargando) {
    return (
      <section className="min-h-screen bg-[color:var(--bg)]" aria-busy="true">
        <GridSkeleton header="line" />
      </section>
    )
  }

  // La API falló (productos), o no se pudo traer la lista de categorías y la línea no está entre los productos (podría
  // ser una categoría): no se puede afirmar que no exista. Mismo estado que /products: «No pudimos cargar» + Reintentar.
  if (!available || (!line && !cats.available)) {
    // La misma página que CategoryPage (CatalogUnavailablePage): fallaron los productos, o (con productos bien) la lista de categorías.
    return <CatalogUnavailablePage path={`/linea/${lineSlug || ''}`} kind={available ? 'categories' : 'products'} onRetry={reintentar} />
  }

  if (!line && lineSlug && cats.slugs.has(lineSlug)) {
    return <Navigate to={`/products/${lineSlug}`} replace />
  }

  if (!line) {
    return <CatalogUnavailablePage path={`/linea/${lineSlug || ''}`} variant="line-not-found" />
  }

  const otras = lines.filter((l) => l.slug !== line.slug)

  return (
    <section className="min-h-screen bg-[color:var(--bg)]">
      <Seo
        title={`${line.name} · Kolortec`}
        description={t('seo.lineDesc', 'Todos los productos de la línea, con ficha técnica y acceso al detalle de cada equipo.')}
        path={`/linea/${line.slug}`}
      />

      <div className="px-6 pt-[clamp(56px,8vw,96px)] lg:px-40">
        <nav className="mb-3 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]">
          <Link to="/products" className="transition hover:text-primary">{t('catalog.breadcrumbProducts', 'Productos')}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-white">{line.name}</span>
        </nav>
        <div className="mb-1 flex items-center gap-2 kt-reveal">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">
            {t('pages.line.eyebrow', 'Línea')}
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.02] kt-reveal">
          {line.name}
          <span className="text-primary">.</span>
        </h1>
      </div>

      <div className="px-6 py-[42px] lg:px-40">
        <div className="mb-6 inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af] kt-reveal">
          <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">
            {lineProducts.length} {lineProducts.length === 1 ? 'item' : 'items'}
          </strong>
        </div>

        {lineProducts.length === 0 ? (
          <CatalogEmptyState
            className="kt-reveal"
            title={t('catalog.emptyTitle', 'Próximamente')}
            body={t('pages.line.emptyBody', 'Todavía no hay productos asignados a esta línea.')}
            action={
              <Link to="/products" className="font-bold text-primary hover:underline">
                {t('pages.line.back', 'Volver a productos')}
              </Link>
            }
          />
        ) : (
          <div className={`${GRID} kt-reveal`}>
            {lineProducts.map((item, index) => (
              <ProductCard
                key={item.id ?? item.slug ?? `${item.name}-${index}`}
                item={item}
                className="opacity-100"
              />
            ))}
          </div>
        )}

        {otras.length > 0 ? (
          <div className="mt-14 border-t border-[#2a2a2a] pt-8 kt-reveal">
            <h2 className="title-font m-0 mb-4 text-[1.6rem] leading-[1.05]">
              {t('pages.line.otherLines', 'Otras líneas')}
              <span className="text-primary">.</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {otras.map((l) => (
                <Link
                  key={l.slug}
                  to={`/linea/${l.slug}`}
                  /* Mismo chip que "Otras categorías": rectangular y con altura
                     táctil. Eran dos lenguajes distintos para la misma cosa. */
                  className="inline-flex min-h-[40px] items-center bg-[#1b212b] px-3 text-[12px] font-black uppercase tracking-[0.06em] text-[#c8ced8] transition hover:bg-primary hover:text-[#111]"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default LinePage
