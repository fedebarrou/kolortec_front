import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CatalogEmptyState from '../components/CatalogEmptyState'
import { getShopProducts, getLines, slugifyLinea } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { getCategories } from '../../../data/categories.js'

// Misma densidad que el resto del catálogo.
const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'

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
  const [products, setProducts] = useState([])
  // lines: undefined = cargando, [] = no hay ninguna línea cargada en el catálogo.
  const [lines, setLines] = useState(undefined)
  // categorySlugs: undefined = cargando (hace falta ANTES de decir "no existe").
  const [categorySlugs, setCategorySlugs] = useState(undefined)

  useEffect(() => {
    let mounted = true
    getShopProducts().then((r) => { if (mounted) setProducts(Array.isArray(r) ? r : []) })
    getLines().then((l) => { if (mounted) setLines(Array.isArray(l) ? l : []) })
    getCategories().then((list) => {
      if (mounted) setCategorySlugs(new Set((Array.isArray(list) ? list : []).map((c) => c.slug)))
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [lineSlug])

  const line = useMemo(
    () => (lines ?? []).find((l) => l.slug === lineSlug) ?? null,
    [lines, lineSlug],
  )

  const lineProducts = useMemo(
    () => products.filter((p) => p.line && slugifyLinea(p.line) === lineSlug),
    [products, lineSlug],
  )

  // Cargando: seccion vacia para no parpadear "no encontrada" antes de tener datos.
  if (lines === undefined || categorySlugs === undefined) {
    return <section className="min-h-screen bg-[#050505]" aria-busy="true" />
  }

  if (!line && lineSlug && categorySlugs.has(lineSlug)) {
    return <Navigate to={`/products/${lineSlug}`} replace />
  }

  if (!line) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <Seo
          title={t('seo.lineNotFound', 'Línea no encontrada · Kolortec')}
          description={t('seo.lineNotFoundDesc', 'Esta línea no existe en el catálogo. Volvé a productos para ver la línea completa.')}
          path={`/linea/${lineSlug || ''}`}
          noindex
        />
        <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {t('pages.line.notFoundTitle', 'Línea no encontrada')}
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">{t('pages.line.notFoundBody', 'Esta línea no existe en el catálogo.')}</p>
        <Link to="/products" className="font-bold text-primary">{t('pages.line.back', 'Volver a productos')}</Link>
      </section>
    )
  }

  const otras = (lines ?? []).filter((l) => l.slug !== line.slug)

  return (
    <section className="min-h-screen bg-[#050505]">
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
            title={t('catalog.emptyTitle', 'Proximamente')}
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
