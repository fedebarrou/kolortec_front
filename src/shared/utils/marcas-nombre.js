/**
 * marcas-nombre — qué hace la tira de marcas con el nombre de cada una (mockup 2026-10-20-marcas-nombre).
 *
 * `section_card_styles.marcas.name_position` de /public/web-config: no | derecha | abajo; null = sin elegir.
 * FUNCIONES PURAS (sin DOM ni React) para poder probarlas en node: scripts/check-marcas-nombre.mjs.
 */

export const NAME_POSITIONS = ['no', 'derecha', 'abajo']

/** `name_position` válido del back o null: cualquier otra cosa se ignora y la tira queda como siempre. */
export function normalizarNamePosition(valor) {
  return NAME_POSITIONS.includes(valor) ? valor : null
}

/**
 * Cómo se dibuja el nombre de UNA marca.
 *   null / 'derecha' → como siempre: nombre visible a la derecha del logo, clase de siempre.
 *   'no'             → sin nombre; pasa a ser el alt del logo y el title/aria-label del item.
 *   'abajo'          → nombre visible, y la clase --abajo (columna, nombre chico debajo).
 * Una marca SIN logo ni shapes no tiene otra cosa que mostrar: conserva su nombre aunque sea 'no' y no pasa a columna.
 * @param {{ name?: string, logo?: string|null, shapes?: unknown[], namePosition?: string|null }} logo
 */
export function decidirNombreMarca(logo) {
  const pos = normalizarNamePosition(logo?.namePosition)
  const tieneMarca = Boolean(logo?.logo || logo?.shapes?.length)
  const ocultarNombre = pos === 'no' && tieneMarca
  return {
    ocultarNombre,
    mostrarNombre: !ocultarNombre,
    itemClass: pos === 'abajo' && tieneMarca ? 'kt-marquee-item-clientlogo kt-marquee-item-clientlogo--abajo' : 'kt-marquee-item-clientlogo',
    alt: ocultarNombre ? logo.name : '',
    title: ocultarNombre ? logo.name : undefined,
    ariaLabel: ocultarNombre ? logo.name : undefined,
  }
}
