/**
 * Origen con el que se llega a una ficha de producto (`/producto/:slug`).
 *
 * Regla de la flecha «volver» de la ficha (Fedev, 21-oct: «estamos en un cabezal móvil y, entre
 * por donde entre, al volver quiero ir a la categoría, Cabezales móviles»):
 *
 *  - SIEMPRE lleva a la categoría del producto (`/products/<product.category>`; `/products` si no tiene).
 *  - Si la página anterior es JUSTO esa categoría, vuelve por el historial (`navigate(-1)`): así
 *    conserva el `?etiqueta=` elegido y el scroll.
 *  - En cualquier otro caso (landing, buscador, catálogo, otra ficha, otra categoría, link directo)
 *    navega a la categoría del producto.
 *
 * Para saber «de qué categoría venís», las cards de CategoryPage pasan `state={{ desde: 'categoria',
 * categoria: <slug> }}` (ver `estadoOrigen`). El botón atrás del NAVEGADOR no mira nada de esto: es
 * el historial.
 */
export const ORIGEN_CATEGORIA = 'categoria'

/** `state` para un <Link>/navigate() parado en la categoría `slug`; undefined si no hay (no pisa nada). */
export function estadoOrigen(slug) {
  const categoria = slug == null ? '' : String(slug)
  return categoria ? { desde: ORIGEN_CATEGORIA, categoria } : undefined
}

/** `state` según la página donde estás parado (para el buscador del header, que vive en todas). */
export function origenDesdeRuta(pathname) {
  const m = /^\/products\/([^/]+)\/?$/.exec(String(pathname || ''))
  if (!m) return undefined
  try {
    return estadoOrigen(decodeURIComponent(m[1]))
  } catch {
    return undefined
  }
}

/**
 * ¿La entrada anterior del historial es la categoría `categoriaProducto`?
 * Sólo entonces «volver» puede ser `navigate(-1)` sin perder filtro ni scroll.
 */
export function vienesDeSuCategoria(state, categoriaProducto) {
  const cat = categoriaProducto == null ? '' : String(categoriaProducto)
  return Boolean(cat) && state?.desde === ORIGEN_CATEGORIA && state?.categoria === cat
}
