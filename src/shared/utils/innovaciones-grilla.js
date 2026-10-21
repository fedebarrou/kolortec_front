/**
 * innovaciones-grilla — cómo se muestran las innovaciones de la ficha (mockup 2026-10-20-innovaciones, opción B;
 * detalle en un recuadro arriba: mockup 2026-10-21-innovaciones-imagen, opción C1).
 *
 * Hasta 4 innovaciones: lista completa con descripción, como siempre. Desde la 5.ª: grilla de fichas
 * compactas (compu) / carrusel de páginas de 6 (celular, 2 columnas × 3 filas), con el detalle de la
 * señalada en un recuadro fijo arriba de la grilla.
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

/** ¿La innovación tiene algo para mostrar en el recuadro de detalle? Una descripción de sólo espacios es no tener. */
export function tieneDescripcion(item) {
  return typeof item?.description === 'string' && item.description.trim() !== ''
}

/** Índice de la innovación que el recuadro muestra al cargar: la primera con descripción. Ninguna → -1 (sin recuadro). */
export function primeraConDescripcion(items) {
  return Array.isArray(items) ? items.findIndex(tieneDescripcion) : -1
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

/**
 * Guiones suaves (U+00AD) en las palabras largas de un título, por sílabas del español.
 * Por qué no alcanza con `hyphens: auto`: Chrome de escritorio sólo parte con guion si ya bajó el diccionario del
 * idioma (no está garantizado) y, sin él, la palabra desborda o se corta en seco. Un guion suave lo respeta
 * cualquier navegador: se ve sólo si la palabra no entra y se parte ahí, con su guion.
 * Silabeo aproximado (no una librería): diptongos juntos, hiatos de dos vocales fuertes separados, una consonante
 * pasa a la sílaba siguiente, de dos se separan salvo grupos como pr/bl/ch/ll; ningún fragmento de menos de 2 letras (se une al vecino) y 3 como mínimo en el último.
 */
const GUION_SUAVE = '\u00AD'
const VOCALES = 'aeiouáéíóúü'
const FUERTES = 'aeoáéíóú'
const INSEPARABLES = ['ch', 'll', 'rr', 'pr', 'pl', 'br', 'bl', 'fr', 'fl', 'tr', 'dr', 'cr', 'cl', 'gr', 'gl', 'kr', 'kl']
const LARGO_MIN = 8
const LADO_IZQ_MIN = 2
const LADO_DER_MIN = 3

export function conGuiones(texto) {
  if (typeof texto !== 'string') return texto
  return texto.replace(/\p{L}+/gu, (palabra) => {
    if (palabra.length < LARGO_MIN) return palabra
    const l = palabra.toLowerCase()
    if (l.length !== palabra.length) return palabra // mayúsculas que cambian el largo (ß…): no se toca
    // núcleos de sílaba: cada vocal, salvo que forme diptongo con la anterior
    const nucleos = []
    for (let i = 0; i < l.length; i += 1) {
      if (!VOCALES.includes(l[i])) continue
      const prev = nucleos[nucleos.length - 1]
      const pegada = prev && prev.fin === i && !(FUERTES.includes(l[i - 1]) && FUERTES.includes(l[i]))
      if (pegada) prev.fin = i + 1
      else nucleos.push({ ini: i, fin: i + 1 })
    }
    const cortes = []
    for (let n = 1; n < nucleos.length; n += 1) {
      const a = nucleos[n - 1]
      const b = nucleos[n]
      const cons = l.slice(a.fin, b.ini)
      let corte = b.ini
      if (cons.length === 1) corte = b.ini - 1
      else if (cons.length >= 2) corte = INSEPARABLES.includes(cons.slice(-2)) ? b.ini - 2 : b.ini - 1
      if (corte >= LADO_IZQ_MIN && l.length - corte >= LADO_DER_MIN) cortes.push(corte)
    }
    // Ningún fragmento de menos de 2 letras: se une con su vecino (al de la derecha; el último, al de la izquierda).
    for (let k = 0; k <= cortes.length; ) {
      const ini = k === 0 ? 0 : cortes[k - 1]
      const fin = k === cortes.length ? l.length : cortes[k]
      if (fin - ini >= LADO_IZQ_MIN) {
        k += 1
        continue
      }
      cortes.splice(k === cortes.length ? k - 1 : k, 1)
      k = 0
    }
    let salida = ''
    for (let i = 0; i < palabra.length; i += 1) salida += (cortes.includes(i) ? GUION_SUAVE : '') + palabra[i]
    return salida
  })
}
