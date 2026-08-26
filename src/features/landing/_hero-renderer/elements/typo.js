import { cqwType } from '../responsive'

/**
 * typoStyle(p, slot, fallbacks={}) — arma el style tipográfico de un slot.
 *
 * Este archivo se copia BYTE-IDÉNTICO a
 * tiendita-store/components/hero-renderer/elements/typo.js — por eso no
 * importa `_editor/typoSlots.js` (el store no tiene `_editor/`): cada View
 * define su propio objeto de slot local con las mismas claves que
 * `_editor/typoSlots.js` (ver ese archivo para la fuente de verdad del mapa
 * widget→slots que usa el Inspector).
 *
 * - p: props del elemento (post `effectiveProps`).
 * - slot: { font, weight, size, lh, ls, color, transform } → nombre de la
 *   clave de `p` a leer para cada campo. Un slot puede omitir cualquier
 *   campo (p.ej. `button` no tiene `lh`) → esa propiedad de estilo nunca
 *   sale en el resultado.
 * - fallbacks: valor a usar cuando la prop del slot está AUSENTE (undefined,
 *   null o ''), para que un diseño guardado HOY (sin las claves nuevas)
 *   renderice EXACTAMENTE igual que antes de este cambio:
 *     - fallbacks.fontSize / fallbacks.letterSpacing van ya en su forma
 *       final de CSS (string, p.ej. 'clamp(...)', '13.0000cqw' o '.08em') —
 *       NO vuelven a pasar por cqwType/`em` acá adentro.
 *     - fallbacks.fontFamily se combina con semántica `||` (igual que el
 *       código legacy de cada View: '' también cae al fallback).
 *     - el resto (fontWeight, lineHeight, textTransform, color) usa `??`
 *       (0 es un valor válido, p.ej. lineHeight:0 o letterSpacingEm:0).
 *
 * Devuelve sólo las claves que corresponden (el slot las pide Y hay un
 * valor, de prop o de fallback) — se puede spreadear sin pisar el resto
 * del style del elemento.
 */
export function typoStyle(p, slot, fallbacks = {}) {
  if (!slot) return {}
  const out = {}

  if (slot.font) {
    const v = p[slot.font] || fallbacks.fontFamily
    if (v !== undefined) out.fontFamily = v
  }
  if (slot.weight) {
    const v = p[slot.weight] ?? fallbacks.fontWeight
    if (v !== undefined) out.fontWeight = v
  }
  if (slot.size) {
    const raw = p[slot.size]
    const size = raw != null && raw !== '' ? cqwType(raw) : fallbacks.fontSize
    if (size !== undefined) out.fontSize = size
  }
  if (slot.lh) {
    const v = p[slot.lh] ?? fallbacks.lineHeight
    if (v !== undefined) out.lineHeight = v
  }
  if (slot.ls) {
    const em = p[slot.ls]
    const ls = em != null && em !== '' ? `${em}em` : fallbacks.letterSpacing
    if (ls !== undefined) out.letterSpacing = ls
  }
  if (slot.transform) {
    const v = p[slot.transform] ?? fallbacks.textTransform
    if (v !== undefined) out.textTransform = v
  }
  if (slot.color) {
    const v = p[slot.color] ?? fallbacks.color
    if (v !== undefined) out.color = v
  }

  return out
}
