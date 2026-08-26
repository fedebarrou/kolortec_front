/**
 * snapEngine.js — máquina de gestos + tween del scrolltelling modo 'snap'.
 *
 * ⚠ COPIA SINCRONIZADA — editar en AMBOS repos (mismo contenido):
 *   tiendita-front/app/(admin)/admin/hero-lab/_renderer/snapEngine.js
 *   tiendita-store/components/hero-renderer/snapEngine.js
 * Contrato: tiendita-front/docs/scroll-hero-contract.md
 *
 * Mecánica (kolortec): un gesto = un paso. El "progress" (fracción 0..1 del
 * tramo trimmed del video global) se tweenea LINEAL desde el marker actual al
 * marker destino en stepDurationMs, desacoplado de la velocidad del scroll.
 * Durante el tween hay lock; tras el lock se exige gestureGapMs de silencio
 * para distinguir un gesto nuevo de la inercia del anterior.
 *
 * DOM-agnóstico: el componente host escucha wheel/touch/teclado, decide
 * capturar o liberar (bordes) y refleja onProgress en el video/frames.
 */

export function createSnapEngine({
  markers,                 // number[] — fracción 0..1 por step (orden ascendente no requerido)
  stepDurationMs = 1100,   // duración del tween entre markers
  gestureGapMs = 130,      // silencio mínimo entre gestos (absorbe inercia)
  initialStep = 0,
  reducedMotion = false,   // true → sin tween: salto directo + arrived inmediato
  releaseStep = false,     // kolortec (ScrollytellingSection.jsx:227-254): agrega un paso
                            // VIRTUAL N (= markers.length, uno más allá del último real). Un
                            // gesto hacia abajo en el último step ya NO libera el scroll de
                            // inmediato: pasa a este step release (sin tween de frame — "se
                            // mantiene el último frame") y recién el SIGUIENTE gesto hacia
                            // abajo libera. El host sigue posicionando el scroll con
                            // getStep() como con cualquier step (reusa scrollToStep/skip: el
                            // wrap mide N*vh, así que el step N cae justo al final del wrap).
  onProgress,              // (fraction, meta) => void — cada frame del tween.
                            // meta = {from,to,t}: from/to son los markers del
                            // tramo en curso (valores 0..1) y t es la fracción
                            // LINEAL 0..1 del tween (1 = llegó/instantáneo).
                            // Los callers que no lo necesiten pueden ignorarlo.
  onStep,                  // (stepIndex) => void — al INICIAR la transición
  onArrived,                // (stepIndex) => void — al TERMINAR el tween
} = {}) {
  const count = Array.isArray(markers) ? markers.length : 0
  // maxStep incluye el step release (= count) cuando releaseStep está activo.
  const maxStep = releaseStep && count ? count : count - 1
  let step = Math.max(0, Math.min(maxStep, initialStep))
  let progress = count ? markers[Math.min(step, count - 1)] : 0
  let raf = 0
  let lockUntil = 0
  let lastInputAt = -Infinity
  let destroyed = false

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())
  const emitProgress = (p, meta) => { progress = p; if (onProgress) onProgress(p, meta) }
  // markerAt: el step release (target === count) no tiene marker propio →
  // se queda en el último marker real (kolortec: "se mantiene el último frame").
  const markerAt = (target) => markers[Math.min(target, count - 1)]

  const finish = (target) => {
    raf = 0
    const p = markerAt(target)
    emitProgress(p, { from: p, to: p, t: 1 })
    if (onArrived) onArrived(target)
  }

  const tweenTo = (target) => {
    if (raf) cancelAnimationFrame(raf)
    const from = progress
    const to = markerAt(target)
    // Release: sin tween de frame (mismo frame que el último step real).
    if (reducedMotion || stepDurationMs <= 0 || target >= count) { finish(target); return }
    const start = now()
    const tick = () => {
      if (destroyed) return
      const t = Math.min(1, (now() - start) / stepDurationMs)
      emitProgress(from + (to - from) * t, { from, to, t }) // curva LINEAL (aprobada en kolortec)
      if (t < 1) raf = requestAnimationFrame(tick)
      else finish(target)
    }
    raf = requestAnimationFrame(tick)
  }

  return {
    /**
     * input(dir) — gesto del usuario (dir: +1 | -1).
     * Devuelve: 'stepped' (avanzó), 'ignored' (lock/inercia: el host debe
     * preventDefault igual), 'released' (borde: el host NO captura el scroll).
     */
    input(dir) {
      if (!count) return "released"
      const t = now()
      const target = step + (dir > 0 ? 1 : -1)
      if (target < 0 || target > maxStep) return "released"
      if (t < lockUntil) return "ignored"
      if (t - lastInputAt < gestureGapMs) { lastInputAt = t; return "ignored" }
      lastInputAt = t
      lockUntil = t + stepDurationMs
      step = target
      if (onStep) onStep(target)
      tweenTo(target)
      return "stepped"
    },
    /** Sincroniza a un step sin gesto (scrollbar, deep-link, resize). */
    syncToStep(target, { instant = false } = {}) {
      if (!count) return
      const clamped = Math.max(0, Math.min(maxStep, target))
      // Ya estamos en el step sin tween en vuelo: re-emitir arrived por si el
      // host quedó en estado "moving" (tween cancelado externamente).
      if (clamped === step && !raf) { if (onArrived) onArrived(clamped); return }
      step = clamped
      if (onStep) onStep(clamped)
      if (instant || reducedMotion) { if (raf) cancelAnimationFrame(raf); finish(clamped) }
      else { lockUntil = now() + stepDurationMs; tweenTo(clamped) }
    },
    getStep: () => step,
    getProgress: () => progress,
    isLocked: () => now() < lockUntil,
    /** true si el step actual es el release virtual (solo con releaseStep:true). */
    isReleaseStep: () => releaseStep && count > 0 && step >= count,
    destroy() { destroyed = true; if (raf) cancelAnimationFrame(raf); raf = 0 },
  }
}
