import { heroSizeMode, heroPantallaCompletaElegida } from './_hero-renderer/scroll-contract.js'

/** Alto de pantalla completa, dividido por la escala del lienzo de kolortec (.kt-zoom-canvas usa zoom). */
export const ALTO_PANTALLA = 'calc(100dvh / var(--kt-canvas-scale, 1))'

/**
 * ¿El diseño ELIGIÓ el alto del celular? true con «Pantalla completa» elegida (las dos claves explícitas, la misma regla que la tienda:
 * heroPantallaCompletaElegida) o con un `heightMobile` / `aspectMobile` explícito. Lo que el diseñador eligió se ve; si no eligió nada, el celular va a pantalla completa
 * (decisión de Fedev, 22-oct; ya no el 65svh ni el mobile_height_vh del marco, que se ignora). Espejo de eligioAltoMovil() del Lab (defaults.js).
 */
export function eligioAltoMovil(settings) {
  const s = settings && typeof settings === 'object' ? settings : {}
  return heroPantallaCompletaElegida(s) || Number.isFinite(s.heightMobile) || (typeof s.aspectMobile === 'string' && s.aspectMobile.trim() !== '')
}

/**
 * Qué `containerHeight` le pasa kolortec al CarouselRenderer (undefined = manda el alto del diseño).
 *   · celular con «Pantalla completa» ELEGIDA → el viewport entero;
 *   · celular con heightMobile / aspectMobile ELEGIDO → undefined: manda lo que el diseño eligió (el renderer usa aspectMobile / heightMobile);
 *   · celular sin elegir nada → PANTALLA COMPLETA (decisión de Fedev, 22-oct: «Kolortec celular = Pantalla completa»; ya no el 65svh ni el mobile_height_vh del marco);
 *   · escritorio / tablet: «Pantalla completa» (también por compat) → el viewport entero; modo Encabezado → undefined.
 * ANTES el celular tenía 65svh clavado en código e ignoraba aspectMobile, heightMobile y el modo.
 */
export function alturaDelHero({ breakpoint, settings, heroFrame }) {
  if (breakpoint === 'mobile') {
    if (heroPantallaCompletaElegida(settings)) return ALTO_PANTALLA
    if (eligioAltoMovil(settings)) return undefined
    // Decisión de Fedev (22-oct): en el celular el Hero de Kolortec va a pantalla completa, no al 65% (ni el del marco ni el 65svh de antes).
    return ALTO_PANTALLA
  }
  return heroSizeMode(settings) === 'full' ? ALTO_PANTALLA : undefined
}
