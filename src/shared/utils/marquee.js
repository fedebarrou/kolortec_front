/**
 * marquee.js — armado del loop de un carrusel infinito (.kt-marquee).
 *
 * El keyframe `kt-marquee-scroll` desplaza el track un -50%: para que la costura
 * sea invisible, la segunda mitad del track tiene que ser IDÉNTICA a la primera.
 * Por eso el set base se repite SIEMPRE una cantidad PAR de veces.
 *
 * Cuántas veces lo decide `useMarqueeFill`, que MIDE el ancho real. Acá sólo se
 * arma el array y se calcula el piso para el primer paint (antes de medir).
 */

/** Repeticiones PARES mínimas para juntar al menos `minItems` items. */
export function evenRepeatsFor(baseCount, minItems = 12) {
  const n = Number(baseCount) || 0
  if (n <= 0) return 2
  let repeats = Math.max(2, Math.ceil(minItems / n))
  if (repeats % 2 !== 0) repeats += 1
  return repeats
}

/**
 * Repite el set base `repeats` veces (se fuerza PAR: ver el -50% de arriba).
 *
 * Duplicar una sola vez —el clásico `[...items, ...items]`— alcanza cuando hay
 * muchos items, pero con 3 o 4 marcas cargadas media pista mide menos que la
 * pantalla y la tira gira MEDIA VACÍA. De última los items se repiten, que es
 * justo lo que se espera de un carrusel de logos.
 *
 * @param {Array} items    set base (ya filtrado)
 * @param {number} repeats repeticiones (de useMarqueeFill)
 * @returns {Array} track completo, largo múltiplo par de items.length
 */
export function buildMarqueeLoop(items, repeats = 2) {
  const base = Array.isArray(items) ? items : []
  if (base.length === 0) return []

  let veces = Math.max(2, Math.round(repeats) || 2)
  if (veces % 2 !== 0) veces += 1

  const out = []
  for (let i = 0; i < veces; i += 1) out.push(...base)
  return out
}

/**
 * Duración del scroll en función de la cantidad de items, para que la velocidad
 * REAL (px/s) no dependa de cuántos productos haya cargados.
 *
 * El keyframe recorre la mitad del track en `--kt-marquee-duration`. Con una
 * duración fija, más items = track más largo = misma duración = MÁS RÁPIDO. Por
 * eso con el catálogo cargado la tira de destacados salía disparada. Ahora se
 * paga un tiempo por item y la velocidad queda constante.
 *
 * @param {number} count           items del set base (sin repetir)
 * @param {number} secondsPerItem  cuánto tarda en pasar un item
 * @param {number} minSeconds      piso, para que con 1-2 items no quede frenético
 */
export function marqueeDuration(count, secondsPerItem = 9, minSeconds = 42) {
  const n = Math.max(1, Number(count) || 0)
  return `${Math.max(minSeconds, Math.round(n * secondsPerItem))}s`
}
