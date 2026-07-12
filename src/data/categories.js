/**
 * Capa de datos — Categories.
 *
 * Hoy: lee el array estático de src/features/catalog/data/categories.js
 * Mañana: fetch al endpoint.
 */

import { PRODUCT_CATEGORIES } from '../features/catalog/data/categories.js'
import { getCategorias as fetchCategoriasApi, DEMO_MODE } from '../shared/services/contentService.js'

// kolortec.com redirige 301 a kolortec.com.ar (ver vercel.json).
const SITE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.SITE_URL) ||
  'https://kolortec.com.ar'

/**
 * Merge de una categoría de la API con el diseño LOCAL por slug: la API es la fuente de la
 * LISTA + nombre + orden + imagen; el local aporta el enriquecimiento visual (nameEn,
 * description, image webp, tags de facetas). Categorías nuevas (sin local) igual se muestran.
 */
function mergeCategoria(apiCat) {
  const local = PRODUCT_CATEGORIES.find((c) => c.slug === apiCat.slug)
  return {
    ...(local || {}),
    slug: apiCat.slug,
    name: apiCat.nombre || local?.name || apiCat.slug,
    image: apiCat.image_url || local?.image || `${SITE}/og-default.jpg`,
  }
}

export async function getCategories() {
  // Lista autoritativa desde tiendita (por cuenta).
  const api = await fetchCategoriasApi().catch(() => [])
  if (Array.isArray(api) && api.length) {
    return api.map(mergeCategoria)
  }
  // Sin categorías cargadas: mock solo en modo vidriera (Vercel). En el build real NO se muestran
  // las categorías hardcodeadas (eran "categorías inventadas" → data fantasma).
  return DEMO_MODE ? PRODUCT_CATEGORIES : []
}

export async function getCategory(slug) {
  if (!slug) return null
  const list = await getCategories()
  const raw = list.find((c) => c.slug === slug)
  return raw ? withCategorySeo(raw) : null
}

export function listCategorySlugs() {
  return PRODUCT_CATEGORIES.map((c) => c.slug)
}

export function withCategorySeo(category) {
  if (!category) return category
  const name = category.name || category.nameEn
  const desc = category.description || category.descriptionEn || ''
  const seoTitle = category.seoTitle || `${name} · Productos Kolortec`
  const seoDescription =
    category.seoDescription ||
    desc ||
    `Línea ${name} Kolortec: equipos profesionales con respaldo, repuestos y soporte técnico local.`
  const ogImage = category.ogImage || category.image || `${SITE}/og-default.jpg`
  return { ...category, seoTitle, seoDescription, ogImage }
}
