/**
 * Capa de rutas — usada por build-time (gen-sitemap, pre-render).
 *
 * Lee todo desde la capa src/data/ (products, categories, guides).
 * Cuando esa capa cambie de mock → fetch, este archivo NO se toca.
 */

import { listCategorySlugs } from './categories.js'
import { listProductSlugs } from './products.js'
import { listGuideSlugs } from './guides.js'

/**
 * Rutas estáticas indexables. `/login` queda fuera (noindex).
 */
export function listStaticRoutes() {
  return [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/products', priority: 0.9, changefreq: 'weekly' },
    { path: '/servicios', priority: 0.7, changefreq: 'monthly' },
    { path: '/descargas', priority: 0.9, changefreq: 'weekly' },
    { path: '/soporte/guias', priority: 0.8, changefreq: 'weekly' },
    { path: '/garantias', priority: 0.7, changefreq: 'monthly' },
    { path: '/contacto', priority: 0.6, changefreq: 'monthly' },
    { path: '/distribuidores', priority: 0.7, changefreq: 'monthly' },
    { path: '/rentals', priority: 0.7, changefreq: 'monthly' },
  ]
}

export function listCategoryRoutes() {
  return listCategorySlugs()
}

export function listProductRoutes() {
  return listProductSlugs()
}

export function listGuideRoutes() {
  return listGuideSlugs()
}

/**
 * Lista completa de paths a pre-renderizar.
 */
export function listAllRoutes() {
  return [
    ...listStaticRoutes().map((r) => r.path),
    ...listCategoryRoutes().map((slug) => `/products/${slug}`),
    ...listProductRoutes().map((slug) => `/producto/${slug}`),
    ...listGuideRoutes().map((slug) => `/soporte/guias/${slug}`),
  ]
}
