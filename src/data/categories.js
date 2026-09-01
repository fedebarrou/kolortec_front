/**
 * Capa de datos — Categories.
 *
 * Fuente de verdad: /public/categorias de tiendita (por cuenta).
 */

import { PRODUCT_CATEGORIES } from '../features/catalog/data/categories.js'
import { getCategorias as fetchCategoriasApi } from '../shared/services/contentService.js'
import { DEMO_MODE } from '../config.js'

/**
 * Categoría de la API → categoría del sitio.
 *
 * ANTES esto hacía un merge con un array de diseño LOCAL buscando por slug, del
 * que heredaba `tags` (las facetas de la barra de filtros), `description` y
 * `nameEn`. Los slugs no coinciden con los del tenant (`cabezal-movil` vs
 * `cabezales-moviles`), así que ese merge no aportaba nada real y sí rompía los
 * filtros; y donde SÍ coincidía por casualidad (`laser`) inyectaba una
 * descripción inventada para esta cuenta. Se va entero, por el mismo criterio
 * que ya se había aplicado a la lista: nada de data fantasma.
 *
 * `image: null` cuando la categoría no tiene foto cargada. Antes caía a
 * `<site>/og-default.jpg`, que NO EXISTE: el SPA responde 200 con el index.html,
 * el navegador no puede decodificarlo como imagen y pinta el alt sobre negro.
 * Devolver null deja que cada componente muestre su placeholder de marca.
 */
function mapCategoria(apiCat) {
  const nombre = apiCat.nombre || apiCat.slug
  return {
    slug: apiCat.slug,
    name: nombre,
    // La API no tiene nombre en inglés: se cae al castellano en vez de dejar la
    // card en blanco cuando lang === 'en'.
    nameEn: nombre,
    image: apiCat.image_url || null,
    orden: apiCat.orden,
  }
}

/**
 * getCategories() — lista plana. Devuelve [] tanto si la cuenta no tiene
 * categorías como si la API falló: para distinguir los dos casos usá
 * `loadCategories()`.
 */
export async function getCategories() {
  const { list } = await loadCategories()
  return list
}

/**
 * loadCategories() — la lista + si se pudo cargar.
 *
 * `getCategorias()` del adapter se traga el error y devuelve [] (fetchWithFallback),
 * así que desde acá "vacío" y "no pude cargar" son indistinguibles. Se toma la
 * lectura conservadora: lista vacía ⇒ `available: false`. Es la diferencia entre
 * decirle a alguien "esta categoría no existe" (404 duro, noindex) y "no pudimos
 * cargar el catálogo" cuando lo único que pasó fue que se cayó el endpoint.
 *
 * PEDIDO A COORDINACIÓN: si `contentService.getCategorias()` propagara el error
 * en vez de devolver [], acá se podría distinguir de verdad.
 */
export async function loadCategories() {
  const api = await fetchCategoriasApi().catch(() => [])
  if (Array.isArray(api) && api.length) {
    return { list: api.map(mapCategoria), available: true }
  }
  // Sin categorías: mock solo en modo vidriera (Vercel). En el build real NO se
  // muestran las categorías hardcodeadas (eran "categorías inventadas" → data fantasma).
  if (DEMO_MODE) return { list: PRODUCT_CATEGORIES, available: true }
  return { list: [], available: false }
}

/**
 * loadCategory(slug) — la categoría + POR QUÉ no está, si no está.
 *   'ok'          → existe
 *   'not-found'   → la lista llegó y este slug no está (404 legítimo, noindex)
 *   'unavailable' → no tenemos lista; no se puede afirmar que no exista
 */
export async function loadCategory(slug) {
  if (!slug) return { status: 'not-found', category: null }
  const { list, available } = await loadCategories()
  if (!available) return { status: 'unavailable', category: null }
  const raw = list.find((c) => c.slug === slug)
  if (!raw) return { status: 'not-found', category: null }
  return { status: 'ok', category: withCategorySeo(raw) }
}

export async function getCategory(slug) {
  const { category } = await loadCategory(slug)
  return category
}

/**
 * Mapa slug → nombre para lo único que necesita traducir un slug suelto: la card
 * de producto, que sólo recibe `item.category` (un slug) y estaba imprimiendo
 * "CABEZAL-MOVIL" crudo. La promesa se memoriza para que N cards compartan UNA
 * request, y el mapa resuelto queda en un cache sincrónico para que a partir de
 * la segunda card no haya parpadeo.
 */
let _nameMapPromise = null
let _nameMap = null

export function peekCategoryNames() {
  return _nameMap
}

export function getCategoryNames() {
  if (!_nameMapPromise) {
    _nameMapPromise = getCategories()
      .then((list) => {
        _nameMap = new Map(list.map((c) => [c.slug, c.name]))
        return _nameMap
      })
      .catch(() => {
        _nameMapPromise = null
        return null
      })
  }
  return _nameMapPromise
}

/**
 * Nombre presentable de un slug cuando todavía no llegó (o no existe) el mapa:
 * "cabezal-movil" → "Cabezal movil". No inventa datos, sólo deja de mostrar la
 * cañería.
 */
export function humanizeCategorySlug(slug) {
  return String(slug ?? '')
    .replace(/[-_]+/g, ' ')
    .trim()
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
  // ogImage sólo si hay una imagen de verdad: `<site>/og-default.jpg` no existe
  // (el SPA devuelve el index.html), así que como og:image era un link roto.
  // `undefined` deja que <Seo> use su propio default, que sí es una imagen real.
  const ogImage = category.ogImage || category.image || undefined
  return { ...category, seoTitle, seoDescription, ogImage }
}
