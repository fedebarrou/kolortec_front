/**
 * Capa de datos — Guides (cluster Soporte).
 *
 * Hoy: lee el array estático de src/features/guides/data/guides.js
 * Mañana: fetch a un CMS o endpoint con los mismos campos
 * (slug, title, seoTitle, seoDescription, excerpt, publishedAt, sections, cta).
 */

import { guides as rawGuides } from '../features/guides/data/guides.js'

export async function getGuides() {
  // SWAP: const res = await fetch(`${API_BASE}/guides`); return res.json()
  return rawGuides
}

export async function getGuide(slug) {
  // SWAP: const res = await fetch(`${API_BASE}/guides/${slug}`); return res.json()
  if (!slug) return null
  return rawGuides.find((g) => g.slug === slug) ?? null
}

export function listGuideSlugs() {
  return rawGuides.map((g) => g.slug)
}
