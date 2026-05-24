/**
 * Capa de datos — Categories.
 *
 * Hoy: lee el array estático de src/features/catalog/data/categories.js
 * Mañana: fetch al endpoint.
 */

import { PRODUCT_CATEGORIES } from '../features/catalog/data/categories.js'

// kolortec.com redirige 301 a kolortec.com.ar (ver vercel.json).
const SITE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.SITE_URL) ||
  'https://kolortec.com.ar'

export async function getCategories() {
  // SWAP: const res = await fetch(`${API_BASE}/categories`); return res.json()
  return PRODUCT_CATEGORIES
}

export async function getCategory(slug) {
  // SWAP: const res = await fetch(`${API_BASE}/categories/${slug}`); return res.json()
  if (!slug) return null
  const raw = PRODUCT_CATEGORIES.find((c) => c.slug === slug)
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
