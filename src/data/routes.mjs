/**
 * Capa de rutas — Fase 4 (sitemap) + base para Fase 5 (datos dinámicos).
 *
 * Hoy importa los mocks que ya viven en src/features/.../data/. Cuando se
 * conecte la API, este archivo se mantiene como interfaz única para:
 *   - scripts/gen-sitemap.mjs (build-time)
 *   - scripts/pre-render (cuando se sume react-snap en Fase 2)
 *
 * En Fase 5 se podrá reemplazar el cuerpo de cada `list*` por un fetch
 * sin tocar los consumidores.
 */

import { PRODUCT_CATEGORIES } from '../features/catalog/data/categories.js'
import { productDetails } from '../features/product/data/productDetails.js'
import { DEMO_PRODUCT_SLUG } from '../features/product/helpers/productDetailDemoHelper.js'

/**
 * Rutas estáticas indexables. `/login` queda fuera (noindex en el componente).
 */
export function listStaticRoutes() {
  return [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/products', priority: 0.9, changefreq: 'weekly' },
    { path: '/servicios', priority: 0.7, changefreq: 'monthly' },
    { path: '/soporte', priority: 0.9, changefreq: 'weekly' },
    { path: '/garantias', priority: 0.7, changefreq: 'monthly' },
    { path: '/contacto', priority: 0.6, changefreq: 'monthly' },
    { path: '/distribuidores', priority: 0.7, changefreq: 'monthly' },
    { path: '/rentals', priority: 0.7, changefreq: 'monthly' },
  ]
}

export function listCategoryRoutes() {
  return PRODUCT_CATEGORIES.map((c) => c.slug)
}

/**
 * Slugs de producto con página de detalle real. Incluye el demo público.
 */
export function listProductRoutes() {
  const slugs = new Set(Object.keys(productDetails))
  slugs.add(DEMO_PRODUCT_SLUG)
  return Array.from(slugs)
}

/**
 * Slugs de guías de soporte. Vacío hasta Fase 3.2.
 */
export function listGuideRoutes() {
  return []
}

/**
 * Lista completa de paths a pre-renderizar en Fase 2 (react-snap).
 */
export function listAllRoutes() {
  return [
    ...listStaticRoutes().map((r) => r.path),
    ...listCategoryRoutes().map((slug) => `/products/${slug}`),
    ...listProductRoutes().map((slug) => `/producto/${slug}`),
    ...listGuideRoutes().map((slug) => `/soporte/guias/${slug}`),
  ]
}
