/**
 * Capa de datos — Products.
 *
 * Hoy: lee desde el mock (src/features/landing/data/landingData.js +
 * src/features/product/data/productDetails.js).
 * Mañana (cuando llegue la API): cada función hace fetch al endpoint
 * y devuelve la misma forma. Las vistas y el sitemap consumen
 * SIEMPRE este archivo — no se importa el mock directamente.
 *
 * Punto de swap mock → API: marcado con `// SWAP: ...`
 */

import { defaultLandingContent } from '../features/landing/data/landingData.js'
import { productDetails } from '../features/product/data/productDetails.js'
import { demoProductDetail, DEMO_PRODUCT_SLUG } from '../features/product/helpers/productDetailDemoHelper.js'

const SITE = 'https://kolortec.com.ar'

/**
 * Lista resumida de productos (cards). Devuelve la forma que consumen
 * ShopPage, CategoryPage, FeaturedSection, GarantiasPage, etc.
 */
export async function getProducts() {
  // SWAP: const res = await fetch(`${API_BASE}/products`); return res.json()
  return defaultLandingContent.products.items
}

/**
 * Detalle completo de un producto por slug. Incluye SEO normalizado.
 */
export async function getProduct(slug) {
  // SWAP: const res = await fetch(`${API_BASE}/products/${slug}`); return res.json()
  if (!slug) return null
  if (slug === DEMO_PRODUCT_SLUG) return withProductSeo(demoProductDetail)
  const raw = productDetails[slug]
  return raw ? withProductSeo(raw) : null
}

/**
 * Slugs de productos con detalle real publicado. Lo usa el sitemap y
 * el pre-render. Sigue exactamente el mismo origen que getProduct(slug).
 */
export function listProductSlugs() {
  const slugs = new Set(Object.keys(productDetails))
  slugs.add(DEMO_PRODUCT_SLUG)
  return Array.from(slugs)
}

/**
 * Normaliza/calcula los campos SEO de un producto. La API puede
 * entregar `seoTitle`/`seoDescription`/`ogImage` ya armados; si vienen
 * vacíos o no existen, se derivan de los datos del producto.
 */
export function withProductSeo(product) {
  if (!product) return product
  const shortDesc = (product.shortDescription || product.tagline || product.name || '').replace(/[.\s]+$/, '')
  const seoTitle = product.seoTitle || `${product.name} · ${product.family || 'Iluminación'} Kolortec`
  const seoDescription =
    product.seoDescription ||
    `${shortDesc}. Equipo Ready to Work con repuestos y soporte técnico local de Kolortec.`
  const ogImage =
    product.ogImage ||
    product.heroImage ||
    (Array.isArray(product.gallery) && product.gallery[0]) ||
    `${SITE}/og-default.jpg`
  return { ...product, seoTitle, seoDescription, ogImage }
}
