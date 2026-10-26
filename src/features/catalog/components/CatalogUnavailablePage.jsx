import CatalogLoadError, { BackLink } from './CatalogLoadError'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'

/**
 * CatalogUnavailablePage — la ÚNICA página de catálogo sin contenido. La usan CategoryPage y LinePage (las dos variantes) y la
 * ficha del producto (sólo «no encontrado»).
 *
 *   - variant 'unavailable' (por defecto): no se pudo cargar. Título como h1 dentro de una caja punteada (CatalogLoadError) con
 *     Reintentar; `kind` dice qué falló ('products' | 'categories') y `onRetry` vuelve a pedir. El «Volver a productos» va debajo,
 *     centrado y en gris (secundario: lo principal es Reintentar).
 *   - variant 'category-not-found' / 'line-not-found' / 'product-not-found': la lista llegó y esa categoría / línea / producto no existe
 *     (un 404 REAL, no una API caída). Es una respuesta: no hay nada que reintentar. Se dibuja con la forma publicada del sitio para un
 *     «no encontrado» (el 404 de App.jsx, la guía): h1 title-font de clamp(2.4rem,6vw,4.6rem) con punto amarillo, padding de página
 *     (px-6 / lg:px-40), cuerpo en --muted y «Volver a productos» en amarillo (`font-bold text-primary`, como en HEAD y en la guía),
 *     con destino de 44px y foco.
 *
 * Todas llevan su Seo (noindex,follow: es un fallo, no contenido) y el título como único h1 de la página.
 * No hay un componente de 404 exportado que reutilizar (NotFoundPage vive dentro de App.jsx y trae su eyebrow «404» y sus tres botones),
 * así que se igualan medidas y clases. Decisión: docs/diseno/DECISIONES-VISUALES.md.
 * La ficha con la API de productos CAÍDA no pasa por acá: tiene su propia pantalla con Reintentar (ProductDetailPage), con el mismo
 * h1 (clamp(2.4rem,6vw,4.6rem)) para que la ficha no tenga dos escalas de título de error.
 */
function CatalogUnavailablePage({ path, variant = 'unavailable', kind = 'products', onRetry }) {
  const { t } = useLanguage()
  const linea = variant === 'line-not-found'
  const producto = variant === 'product-not-found'
  const noEncontrada = variant !== 'unavailable'

  const seoTitle = !noEncontrada
    ? t('seo.categoryUnavailable', 'Catálogo no disponible · Kolortec')
    : producto
      ? t('seo.productNotFound', 'Producto no encontrado · Kolortec')
      : linea
        ? t('seo.lineNotFound', 'Línea no encontrada · Kolortec')
        : t('seo.categoryNotFound', 'Categoría no encontrada · Kolortec')
  const seoDescription = !noEncontrada
    ? t('seo.categoryUnavailableDesc', 'No pudimos cargar el catálogo en este momento. Volvé a intentar en unos minutos.')
    : producto
      ? t('seo.productNotFoundDesc', 'Este producto no está publicado o el enlace cambió. Volvé al catálogo para ver toda la línea Kolortec.')
      : linea
        ? t('seo.lineNotFoundDesc', 'Esta línea no existe en el catálogo. Volvé a productos para ver la línea completa.')
        : t('seo.categoryNotFoundDesc', 'La categoría solicitada no existe en el catálogo. Volvé a productos para explorar la línea completa.')

  return (
    <section className={`min-h-screen bg-[color:var(--bg)] px-6 lg:px-40 ${noEncontrada ? 'py-[42px]' : 'pt-[clamp(56px,8vw,96px)] pb-[42px]'}`}>
      <Seo title={seoTitle} description={seoDescription} path={path} noindex />
      {noEncontrada ? (
        <>
          <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
            {producto
              ? t('pages.product.notFoundTitle', 'Producto no encontrado')
              : linea ? t('pages.line.notFoundTitle', 'Línea no encontrada') : t('pages.category.notFoundTitle', 'Categoría no encontrada')}
            <span className="text-primary">.</span>
          </h1>
          <p className="mb-3 text-[color:var(--muted)]">
            {producto
              ? t('pages.product.notFoundBody', 'Este producto no existe o ya no está publicado.')
              : linea ? t('pages.line.notFoundBody', 'Esta línea no existe en el catálogo.') : t('pages.category.notFoundBody', 'Esta categoría no existe en el catálogo.')}
          </p>
          {/* -ml-3: el destino de 44px lleva 12px de padding a cada lado; así el texto arranca en la misma guía que el título. */}
          <div className="-ml-3">
            <BackLink to="/products" primary>{linea ? t('pages.line.back', 'Volver a productos') : t('pages.category.back', 'Volver a productos')}</BackLink>
          </div>
        </>
      ) : (
        <>
          <CatalogLoadError kind={kind} level={1} onRetry={onRetry} />
          <div className="mt-4 text-center">
            <BackLink to="/products">{t('pages.category.back', 'Volver a productos')}</BackLink>
          </div>
        </>
      )}
    </section>
  )
}

export default CatalogUnavailablePage
