/**
 * snapIdle.js — efectos idle (kolortec) del scrolltelling modo 'snap':
 * breathing (el fondo pulsa a grayscale tras N segundos sin interacción) y
 * parallax sutil de las capas de texto según la distancia al punto pinned.
 *
 * ⚠ COPIA SINCRONIZADA — editar en AMBOS repos (mismo contenido):
 *   tiendita-front/app/(admin)/admin/hero-lab/_renderer/snapIdle.js
 *   tiendita-store/components/hero-renderer/snapIdle.js
 * Contrato: tiendita-front/docs/scroll-hero-contract.md
 *
 * DOM-agnóstico: no toca el DOM ni depende de React — el host decide qué
 * hacer con los valores emitidos (filtro CSS, transform, etc.).
 */

/**
 * createBreathing({ isIdle, onValue, idleDelayMs, periodMs }) — loop rAF
 * propio (arranca al llamarla). `isIdle()` es una función que el host provee
 * y debe devolver true mientras el paso está "en reposo" (no tweeneando):
 * apenas devuelve false el ciclo se corta a 0 y el reloj de idle se reinicia.
 * Cuando `isIdle()` lleva > idleDelayMs devolviendo true de forma continua,
 * arranca el pulso grayscale (coseno 0→1→0, período periodMs) y llama a
 * onValue(g) en cada frame con g: 0..1. Devuelve { destroy() }.
 */
export function createBreathing({ isIdle, onValue, idleDelayMs = 5000, periodMs = 4200 } = {}) {
  let raf = 0
  let idleSince = null
  let phase0 = null
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

  const tick = () => {
    const t = now()
    if (!isIdle || !isIdle()) {
      idleSince = null
      if (phase0 != null) { phase0 = null; if (onValue) onValue(0) }
    } else {
      if (idleSince == null) idleSince = t
      if (t - idleSince >= idleDelayMs) {
        if (phase0 == null) phase0 = t
        const ph = ((t - phase0) % periodMs) / periodMs
        if (onValue) onValue((1 - Math.cos(ph * 2 * Math.PI)) / 2)
      } else if (phase0 != null) {
        phase0 = null
        if (onValue) onValue(0)
      }
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return {
    destroy() { if (raf) cancelAnimationFrame(raf); raf = 0 },
  }
}

/** Parallax sutil (kolortec): deriva de la distancia (px) al punto pinned del step. */
export const parallaxFor = (relPx) => Math.max(-30, Math.min(30, relPx * -0.15))
