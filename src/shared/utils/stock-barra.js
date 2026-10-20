/**
 * stock-barra — la «barra de 3 segmentos» del stock (mockup 2026-10-20-stock, opción B).
 *
 * `stock_nivel` de cada producto/variante de la API pública: 'sin' | 'bajo' | 'medio' | 'alto' | null.
 *   alto → 3 segmentos verdes «En stock» · medio → 2 naranjas «Pocas unidades» · bajo → 1 roja «Últimas unidades»
 *   sin → 0 segmentos, texto apagado «Sin stock» · null / desconocido → NADA (indicador apagado en el panel o back viejo).
 *
 * FUNCIÓN PURA (sin DOM ni React) para probarla en node: scripts/check-stock-barra.mjs.
 */

export const SEGMENTOS = 3

const NIVELES = {
  alto: { encendidos: 3, clave: 'stockBar.alto', texto: 'En stock' },
  medio: { encendidos: 2, clave: 'stockBar.medio', texto: 'Pocas unidades' },
  bajo: { encendidos: 1, clave: 'stockBar.bajo', texto: 'Últimas unidades' },
  sin: { encendidos: 0, clave: 'stockBar.sin', texto: 'Sin stock' },
}

/** `stock_nivel` válido o null: cualquier otra cosa se ignora y no se dibuja nada. */
export function normalizarStockNivel(valor) {
  return Object.hasOwn(NIVELES, valor) ? valor : null
}

/**
 * Cómo se dibuja un nivel. null si no hay nada que mostrar.
 * @returns {{ nivel: string, encendidos: number, segmentos: boolean[], clave: string, texto: string } | null}
 */
export function decidirStockBarra(nivel) {
  const n = normalizarStockNivel(nivel)
  if (!n) return null
  const { encendidos, clave, texto } = NIVELES[n]
  return {
    nivel: n,
    encendidos,
    segmentos: Array.from({ length: SEGMENTOS }, (_, i) => i < encendidos),
    clave,
    texto,
  }
}
