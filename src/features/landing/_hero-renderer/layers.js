/**
 * Orden de capas de una escena del hero (carrusel y scrolltelling).
 *
 *   fondo de escena
 *   -> elementos de FONDO (z <= 0: tipicamente la foto como elemento `media`)
 *   -> scrim / overlay de la escena (la oscuridad y el velo)
 *   -> elementos de CONTENIDO (z >= 1: textos, botones)
 *
 * Antes la oscuridad (`slide.overlay`) y el velo (`slide.scrim`) iban debajo de
 * TODOS los elementos, asi que una foto-elemento a pantalla completa los tapaba:
 * el overlay no se veia. Decision del dueño: la oscuridad va arriba de la foto y
 * debajo del texto.
 *
 * El orden se fija con zIndex EXPLICITOS (no por orden en el DOM) en bandas que no
 * se pisan:  fondo 1..999  <  capas de escena 1000 y 1001  <  contenido >= 1002.
 * Es un archivo idéntico en el editor, el store y kolortec: si lo tocás, tocá los tres.
 */
export const CAPA_ESCENA_BAJA = 1000
export const CAPA_ESCENA_ALTA = 1001
const FONDO_TOPE = 999
const FONDO_PISO = -998
const CONTENIDO_BASE = 1001
const CONTENIDO_TOPE = 1000000

// z del elemento como entero. Sin z (o ilegible) = 1, igual que `el.z ?? 1` del
// resto del renderer: un elemento sin z es contenido, no fondo.
export function zDe(el) {
  const n = typeof el?.z === 'number' ? el.z : parseFloat(el?.z)
  return Number.isFinite(n) ? Math.trunc(n) : 1
}

export const esFondo = (el) => zDe(el) <= 0

// zIndex final del elemento. Conserva el orden relativo dentro de su grupo.
export function zIndexCapa(el) {
  const z = zDe(el)
  if (z <= 0) return FONDO_TOPE + Math.max(z, FONDO_PISO)
  return CONTENIDO_BASE + Math.min(z, CONTENIDO_TOPE)
}

// Ordena por z (estable: a igual z manda el orden del arreglo).
export const porZ = (elements) => [...(elements || [])].sort((a, b) => zDe(a) - zDe(b))

// Parte en dos grupos ya ordenados: { fondo: z<=0, contenido: z>=1 }.
export function partirCapas(elements) {
  const ordenados = porZ(elements)
  return { fondo: ordenados.filter(esFondo), contenido: ordenados.filter((el) => !esFondo(el)) }
}

// Overlay y scrim de la escena: arriba del fondo, sin tapar el mouse. Si quedan
// sobre un elemento de fondo, seleccionarlo/arrastrarlo/clickearlo tiene que seguir andando.
export const estiloCapaEscena = (alta = false) => ({
  zIndex: alta ? CAPA_ESCENA_ALTA : CAPA_ESCENA_BAJA,
  pointerEvents: 'none',
})
