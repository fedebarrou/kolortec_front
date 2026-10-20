/**
 * innovaciones-grilla — cómo se muestran las innovaciones de la ficha (mockup 2026-10-20-innovaciones, opción B).
 *
 * Hasta 4 innovaciones: lista completa con descripción, como siempre. Desde la 5.ª: grilla de fichas
 * compactas (compu) / carrusel de páginas de 6 (celular, 2 columnas × 3 filas).
 * FUNCIONES PURAS (sin DOM ni React) para probarlas en node: scripts/check-innovaciones-grilla.mjs.
 */

/** Hasta esta cantidad (inclusive) se muestran como siempre: la grilla aparece desde la 5.ª. */
export const UMBRAL_LISTA = 4

/** Fichas por página del carrusel de celular (2 columnas × 3 filas). */
export const POR_PAGINA = 6

/** ¿Se muestra la grilla/carrusel? Con 4 o menos (o nada), no. */
export function usaGrilla(cantidad) {
  return Number.isFinite(cantidad) && cantidad > UMBRAL_LISTA
}

/** Parte la lista en páginas de `porPagina` (la última puede ser más corta). Lista vacía o inválida → []. */
export function paginar(items, porPagina = POR_PAGINA) {
  if (!Array.isArray(items) || items.length === 0) return []
  const paginas = []
  for (let i = 0; i < items.length; i += porPagina) paginas.push(items.slice(i, i + porPagina))
  return paginas
}

/**
 * Página visible según el scroll horizontal del carrusel (0-based).
 * `paso` = distancia de scroll entre una página y la siguiente. La última página puede no llegar
 * a alinearse al inicio (el scroll se agota antes): si el scroll llegó al final, es la última.
 */
export function paginaDesdeScroll({ scrollLeft, paso, clientWidth, scrollWidth, total }) {
  if (!(total > 1) || !(paso > 0)) return 0
  if (scrollLeft + clientWidth >= scrollWidth - 2) return total - 1
  const pagina = Math.round(scrollLeft / paso)
  return Math.min(total - 1, Math.max(0, pagina))
}
