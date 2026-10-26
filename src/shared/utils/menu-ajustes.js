/**
 * menu-ajustes — qué ítems del menú de arriba se ven, según los ajustes de la cuenta (20-oct-2026).
 *
 * `ajustes.valores` de /public/web-config (contrato de ajustes v1). Las claves vienen PLANAS, con puntos:
 * `valores['menu.ocultas']`, no una ruta anidada.
 *   · un ítem desaparece si su sección está APAGADA (`tienda`, `servicios`: booleanos) …
 *   · … o si su sección figura en `menu.ocultas` (nombres de DEFAULT_ORDER del back: productos, servicios, …).
 *   · sin `ajustes` (back viejo, API caída) → el menú de siempre. Ningún valor desconocido apaga nada.
 *
 * FUNCIONES PURAS (sin DOM ni React) para probarlas en node: scripts/check-menu-ajustes.mjs.
 */

/**
 * Ítems del menú que dependen de una sección. `flag` = ajuste booleano de la sección; `menu` = su nombre en `menu.ocultas`.
 * Inicio y Soporte (/descargas) no son una sección del builder: no figuran y se ven siempre.
 */
export const SECCION_DEL_ITEM = {
  catalog: { flag: 'tienda', menu: 'productos' },
  services: { flag: 'servicios', menu: 'servicios' },
}

/** `valores` de los ajustes o null: cualquier otra forma (sin `ajustes`, versión vieja del back) se trata como «no hay». */
export function valoresDeAjustes(ajustes) {
  const valores = ajustes?.valores
  return valores && typeof valores === 'object' && !Array.isArray(valores) ? valores : null
}

/** ¿Se muestra el ítem `id` del menú? Sin ajustes, o un ítem sin sección → sí. */
export function itemVisible(id, ajustes) {
  const valores = valoresDeAjustes(ajustes)
  const seccion = SECCION_DEL_ITEM[id]
  if (!valores || !seccion) return true
  if (valores[seccion.flag] === false) return false
  const ocultas = valores['menu.ocultas']
  if (Array.isArray(ocultas) && ocultas.includes(seccion.menu)) return false
  return true
}

/** Filtra los ítems `{ id, … }` del menú. Devuelve el MISMO arreglo si no hay nada que sacar. */
export function filtrarMenu(items, ajustes) {
  if (!valoresDeAjustes(ajustes)) return items
  return items.filter((item) => itemVisible(item.id, ajustes))
}
