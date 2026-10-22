// Curvas de entrada y estados de entrada de los elementos. COPIA SINCRONIZADA — idéntico en el `_renderer/` del admin, en el store
// (components/hero-renderer/elements/) y en kolortec. Sólo importa ../cssSafe (otra copia sincronizada): se puede copiar byte-idéntico.
//
// Lo usa ElementView para los dos modos donde la entrada NO es una animación CSS de keyframes:
//   · scroll CONTINUO: la entrada se escrubea con el progreso (`estiloDeReveal`), y la curva elegida en el panel (`curvaDe`) da la forma.
//   · scroll POR PASOS (snap): la entrada es una transición CSS desde el estado oculto de cada tipo (`estadoSnap`).
// El valor que llega al estilo sale siempre de estas tablas, nunca del dato guardado.

import { cssNumber } from '../cssSafe'

// Mismas curvas que las variables --hc-ease-* de hero-anim.css (ease / ease-out / ease-in-out de CSS son estos bezier).
const BEZIER = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  spring: [0.34, 1.56, 0.64, 1],
  linear: [0, 0, 1, 1],
  // El default del scroll CONTINUO cuando el diseño no fijó curva: el ease-out cúbico (1 - (1 - x)³) con que se publicaba antes de que
  // el panel dejara elegir. No está en la lista del panel: ausente = esta.
  'cubic-out': [0.33, 1, 0.68, 1],
}

/**
 * nombre de curva → f(x) con x en [0,1]. AUSENTE (undefined / null / '') = la de hoy en continuo, 'cubic-out'. Un nombre desconocido cae a 'ease'.
 * Spring puede pasarse de 1: es el rebote.
 */
export function curvaDe(nombre) {
  const clave = nombre === undefined || nombre === null || nombre === '' ? 'cubic-out' : nombre
  const [x1, y1, x2, y2] = Object.prototype.hasOwnProperty.call(BEZIER, clave) ? BEZIER[clave] : BEZIER.ease
  if (x1 === y1 && x2 === y2) return (x) => Math.max(0, Math.min(1, x))
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const X = (t) => ((ax * t + bx) * t + cx) * t
  const Y = (t) => ((ay * t + by) * t + cy) * t
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x
      if (Math.abs(e) < 1e-6) return Y(t)
      const d = dX(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const e = X(t) - x
      if (Math.abs(e) < 1e-6) break
      if (e > 0) hi = t; else lo = t
      t = (lo + hi) / 2
    }
    return Y(t)
  }
}

const clamp01 = (n) => Math.max(0, Math.min(1, n))

/**
 * Estilo de un elemento a medio revelar (scroll continuo). r = progreso 0..1 de la ventana de entrada.
 * → { opacidad (factor), transform (string|undefined), filter, clipPath }
 */
export function estiloDeReveal(tipo, r, curva) {
  const x = clamp01(r)
  const raw = curva(x)
  const eo = clamp01(raw)
  const off = 1 - raw
  const offO = 1 - eo
  const fadeIn = Math.min(1, x * 1.6)
  let opacidad = 1
  let transform
  let filter
  let clipPath
  switch (tipo) {
    case 'fade': opacidad = x; break
    case 'slide-up': opacidad = fadeIn; transform = `translateY(${off * 45}%)`; break
    case 'slide-down': opacidad = fadeIn; transform = `translateY(${-off * 45}%)`; break
    case 'zoom': opacidad = fadeIn; transform = `scale(${0.7 + 0.3 * raw})`; break
    case 'bounce': opacidad = fadeIn; transform = `translateY(${off * 45}%) scale(${0.92 + 0.08 * raw})`; break
    case 'kolortec': opacidad = fadeIn; transform = `translateY(${off * 34}px) scale(${0.96 + 0.04 * raw})`; break
    case 'focus': opacidad = eo; transform = `translateY(${off * 16}px)`; if (eo < 1) filter = `blur(${offO * 5}px)`; break
    case 'blur-in': opacidad = eo; if (eo < 1) filter = `blur(${offO * 14}px)`; break
    case 'slide-left': opacidad = fadeIn; transform = `translateX(${off * 45}%)`; break
    case 'slide-right': opacidad = fadeIn; transform = `translateX(${-off * 45}%)`; break
    case 'rotate-in': opacidad = fadeIn; transform = `rotate(${-8 * off}deg) scale(${0.92 + 0.08 * raw})`; break
    case 'mask-reveal': if (eo < 1) clipPath = `inset(0 ${offO * 100}% 0 0)`; break
    default: break
  }
  return { opacidad, transform, filter, clipPath }
}

// Estado OCULTO de cada tipo para el modo por pasos (el espejo de los `from` de los @keyframes hc-* de hero-anim.css). El estado
// final lleva las mismas propiedades: una transición CSS sólo interpola entre valores que existen en los dos extremos.
// 'none' no está: sin animación el elemento aparece de golpe.
const VISTO = { transform: 'none', filter: 'blur(0px)', clipPath: 'inset(-50% -50% -50% -50%)' }
const OCULTO_SNAP = {
  fade: {},
  'slide-up': { transform: 'translateY(24px)' },
  'slide-down': { transform: 'translateY(-24px)' },
  'slide-left': { transform: 'translateX(24px)' },
  'slide-right': { transform: 'translateX(-24px)' },
  zoom: { transform: 'scale(.85)' },
  bounce: { transform: 'translateY(24px)' },
  focus: { transform: 'translateY(16px)', filter: 'blur(5px)' },
  kolortec: { transform: 'translateY(34px) scale(.96)' },
  'blur-in': { filter: 'blur(14px)' },
  'rotate-in': { transform: 'rotate(-8deg) scale(.92)' },
  'mask-reveal': { clipPath: 'inset(0 100% 0 0)' },
}

/** → { transform, filter, clipPath } del tipo (sólo las propiedades que ese tipo anima), en estado visto u oculto. */
export function estadoSnap(tipo, visto) {
  const oculto = OCULTO_SNAP[tipo]
  const out = {}
  if (!oculto) return out
  for (const k of Object.keys(oculto)) out[k] = visto ? VISTO[k] : oculto[k]
  return out
}

// ── Modo por pasos: qué anima cada elemento, cuánto dura y cuánto tiene que seguir montado el paso que sale ──
export const SNAP_MS_POR_DEFECTO = 700
export const SNAP_CURVA_POR_DEFECTO = 'cubic-bezier(.22,.61,.36,1)'
// El paso saliente se desmonta cuando termina su salida más lenta, entre estos dos topes: el piso es lo que dura la entrada de Kolortec,
// el techo evita que un diseño con 5 s deje montado el paso viejo.
export const SNAP_SALIDA_MIN_MS = 700
export const SNAP_SALIDA_MAX_MS = 2000
// Estos dos tipos NO se resuelven con una transición entre dos estados sino con su @keyframes del carrusel (hc-bounce lleva el
// rebote; hc-mask-reveal cierra la máscara AL FINAL y abre el recorte sin fundido): así se ven igual que en el carrusel.
export const SNAP_CON_KEYFRAMES = ['bounce', 'mask-reveal']

/**
 * Entrada de un elemento en «Por pasos» → { tipo, ms, retardo, easing }.
 *   · SIN la marca `animation.enSnap === true` (VIS-101) lo guardado no cuenta: rige el movimiento de Kolortec (34px, .96, 700 ms,
 *     su curva, sin retardo), que es lo que se publicaba. La marca la escribe SOLO el panel cuando alguien cambia tipo, duración,
 *     delay o curva en este modo; las plantillas (scrollTemplates guarda slide-up 600 ms con retardo i×140), los diseños anteriores y lo
 *     que genera la IA no la llevan, así que no cambian.
 *   · con la marca, tipo 'none' o sin tipo = el movimiento de Kolortec (la duración guardada NO cuenta: normalizeElement escribe 600 ms en
 *     todo elemento sin animación, y eso no es una elección), con el retardo y la curva elegidos.
 *   · con la marca, un tipo elegido se respeta tal cual, con su duración (700 ms si no fijó) y su retardo. Un tipo desconocido cae a 'fade'.
 * `easing` es el nombre de curva guardado (o undefined): el que llama lo traduce con su tabla. `tiposValidos` es ANIM_TYPES de ElementView.
 */
export function entradaSnap(animation, tiposValidos) {
  const a = animation && typeof animation === 'object' ? animation : {}
  if (a.enSnap !== true) return { tipo: 'kolortec', ms: SNAP_MS_POR_DEFECTO, retardo: 0, easing: undefined }
  const elegido = a.type !== undefined && a.type !== null && a.type !== 'none'
  return {
    tipo: elegido ? (tiposValidos.includes(a.type) ? a.type : 'fade') : 'kolortec',
    ms: elegido ? cssNumber(a.durationMs ?? SNAP_MS_POR_DEFECTO, SNAP_MS_POR_DEFECTO) : SNAP_MS_POR_DEFECTO,
    retardo: cssNumber(a.delayMs ?? 0, 0),
    easing: a.easing,
  }
}

/**
 * Cuánto (ms) tiene que seguir montado el paso que sale: la duración más larga de sus elementos, entre el piso y el techo. La salida va
 * SIN retardo (VIS-102, todos juntos), así que el retardo de la entrada no suma.
 */
export function msSalidaSnap(elementos, tiposValidos) {
  let max = 0
  for (const el of Array.isArray(elementos) ? elementos : []) {
    if (!el) continue
    max = Math.max(max, entradaSnap(el.animation, tiposValidos).ms)
  }
  return Math.min(SNAP_SALIDA_MAX_MS, Math.max(SNAP_SALIDA_MIN_MS, max))
}
