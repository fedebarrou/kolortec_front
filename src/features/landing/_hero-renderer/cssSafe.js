/**
 * cssSafe — saneo de datos guardados antes de interpolarlos en CSS (defensa en profundidad).
 *
 * El renderer del hero arma `style={{ background: p.bg, backgroundImage: `url(${u})` }}`
 * con datos del diseño guardado. En el back ya se valida lo que escribe la IA, pero una
 * persona o un dato viejo pueden traer cualquier cosa; en SSR React serializa el style
 * tal cual, así que un `;` o un `)` en el valor puede colar declaraciones ajenas.
 *
 * Regla: lo válido pasa IGUAL (un hero normal no cambia); lo demás cae a un valor inerte
 * (`none`, `undefined` o el fallback que pase quien llama).
 *
 * Sin dependencias, puro y testeable en entorno node.
 */

// ── url ─────────────────────────────────────────────────────────────────────────
// http(s) o ruta que empieza con `/` (NO `//host` ni `/\host`: son otro origen). Todo lo demás (javascript:, data:, vbscript:,
// relativas sin barra, no-strings) → 'none'.
const URL_OK = /^(?:https?:\/\/|\/(?![/\\]))/i

/** Escapa para un string CSS entre comillas dobles: `"`, `\`, saltos de línea y control. */
function escapeCssString(s) {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)
    if (ch === '"' || ch === '\\') out += '\\' + ch
    else if (code < 0x20 || code === 0x7f || code === 0x2028 || code === 0x2029) out += '\\' + code.toString(16) + ' '
    else out += ch
  }
  return out
}

/** `url("…")` seguro, o `none` si no es una URL http(s) / ruta `/`. */
export function cssUrl(u) {
  if (typeof u !== 'string') return 'none'
  const s = u.trim()
  // El navegador ignora tab/salto de línea dentro de la URL: `/<tab>/evil.com` ES `//evil.com`.
  // Se decide sobre la versión sin espacios ni control; se escapa la original.
  if (!s || !URL_OK.test(s.replace(BLANKS, ''))) return 'none'
  return `url("${escapeCssString(s)}")`
}

// ── color ───────────────────────────────────────────────────────────────────────
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COLOR_FN = /^(?:rgb|rgba|hsl|hsla|oklch)\(([^()]*)\)$/i
// Nombre CSS simple (red, transparent, currentColor…). Sin paréntesis no puede ser url()/var().
const COLOR_NAME = /^[a-z]{3,30}$/i

/**
 * El color si es hex, rgb()/rgba()/hsl()/hsla()/oklch() o un nombre simple; si no, `fallback`
 * (por defecto `undefined`, que React omite). Nunca url(), var(), expression() ni `;`.
 */
export function cssColor(c, fallback) {
  if (typeof c !== 'string') return fallback
  const s = c.trim()
  if (HEX.test(s) || COLOR_NAME.test(s)) return s
  const m = COLOR_FN.exec(s)
  if (m) {
    // Argumentos: números, %, / , + - y unidades de ángulo / `none`. Cualquier otra letra
    // (url, var, expr…) o puntuación (; { } " ') invalida.
    const args = m[1].replace(/deg|grad|rad|turn|none/gi, '')
    if (/^[\d\s.,%/+\-eE]*$/.test(args)) return s
  }
  return fallback
}

/** Color hex de 6 dígitos + sufijo alfa (`#aabbcc` + `59`), o `undefined` si no es hex de 6. */
export function cssColorAlpha(c, alphaHex) {
  const v = cssColor(c)
  return v && /^#[0-9a-f]{6}$/i.test(v) ? v + alphaHex : undefined
}

// ── números ─────────────────────────────────────────────────────────────────────
/** Número finito, o `fallback` (por defecto 0). Para ángulos, rotaciones, escalas, tiempos. */
export function cssNumber(n, fallback = 0) {
  if (n === null || n === undefined || n === '' || typeof n === 'boolean') return fallback
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}

/** Ángulo en grados: número finito, o 0. */
export const cssAngle = (n) => cssNumber(n, 0)

// ── otros valores libres ────────────────────────────────────────────────────────
/** Porcentaje (focal x/y): número finito o `undefined` (React omite → queda el default del navegador). */
export function cssPercent(n) {
  const v = cssNumber(n, NaN)
  return Number.isNaN(v) ? undefined : `${v}%`
}

/** background-position `x% y%` con ambos finitos; si falta alguno → `undefined` (default del navegador). */
export function cssPosition(x, y) {
  const px = cssPercent(x)
  const py = cssPercent(y)
  return px && py ? `${px} ${py}` : undefined
}

/** background-size permitido; otra cosa → `undefined`. */
const FIT_OK = new Set(['cover', 'contain', 'auto', '100% 100%', '100%'])
export function cssFit(f) {
  return typeof f === 'string' && FIT_OK.has(f.trim()) ? f.trim() : undefined
}

/**
 * font-family: nombres con letras/dígitos/espacio/guion/punto, comillas, comas y `var(--x…)` simple
 * del propio sitio. Sin `;`, llaves, `url(`, `\` ni otros paréntesis → `fallback`.
 */
const FONT_OK = /^[\p{L}\p{N}\s,'"\-._]+$/u
const FONT_VAR = /^var\(--[\w-]+(?:\s*,\s*[\p{L}\p{N}\s,'"\-._]+)?\)$/u
export function cssFontFamily(f, fallback) {
  if (typeof f !== 'string') return fallback
  const s = f.trim()
  if (!s) return fallback
  if (!(FONT_OK.test(s) || FONT_VAR.test(s))) return fallback
  // comillas BALANCEADAS: una sin cerrar se come lo que venga después en la declaración
  if (/["']/.test(s.replace(/"[^"]*"|'[^']*'/g, ''))) return fallback
  return s
}

/**
 * text-shadow / box-shadow: longitudes, colores simples y comas. Sin url(), var(), `;`, llaves, comillas.
 * Se admiten rgb()/rgba()/hsl()/hsla() sin anidar. Si no pasa → `fallback`.
 */
const SHADOW_TOKEN = /^(?:none|inset|-?\d*\.?\d+(?:px|em|rem|%|cqw)?|#[0-9a-f]{3,8}|[a-z]{3,30}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%/+-]*\))$/i
export function cssShadow(v, fallback) {
  if (typeof v !== 'string') return fallback
  const s = v.trim()
  if (!s) return fallback
  // separar por comas de nivel superior, luego por espacios de nivel superior
  const layers = s.split(/,(?![^()]*\))/)
  for (const layer of layers) {
    const tokens = layer.trim().match(/(?:[^\s(]+\([^)]*\)|\S+)/g)
    if (!tokens || !tokens.every((t) => SHADOW_TOKEN.test(t))) return fallback
  }
  return s
}

// ── tipografía: valores sueltos que llegan de `p.*` ─────────────────────────────
const WEIGHT_KW = new Set(['normal', 'bold', 'bolder', 'lighter'])
/** font-weight: número 1-1000 (o string numérico) o keyword; otra cosa → `undefined`. */
export function cssWeight(w) {
  if (typeof w === 'string' && WEIGHT_KW.has(w.trim())) return w.trim()
  const v = cssNumber(w, NaN)
  return v >= 1 && v <= 1000 ? v : undefined
}

/** line-height: número finito o longitud/porcentaje simple (`1.2`, `120%`, `24px`); si no → `undefined`. */
export function cssLineHeight(h) {
  if (typeof h === 'number') return Number.isFinite(h) ? h : undefined
  if (typeof h === 'string' && /^\s*\d*\.?\d+(?:px|em|rem|%)?\s*$/.test(h)) return h.trim()
  return undefined
}

const TRANSFORM_OK = new Set(['none', 'uppercase', 'lowercase', 'capitalize'])
export const cssTextTransform = (t) => (typeof t === 'string' && TRANSFORM_OK.has(t.trim()) ? t.trim() : undefined)

const ALIGN_OK = new Set(['left', 'right', 'center', 'justify', 'start', 'end'])
export const cssTextAlign = (a) => (typeof a === 'string' && ALIGN_OK.has(a.trim()) ? a.trim() : undefined)

// ── enlaces y fuentes de medios (no son CSS, misma defensa) ─────────────────────
// Los navegadores ignoran tab/salto de línea/control dentro del esquema ("java	script:" ES
// javascript:), así que se decide sobre una versión SIN espacios ni control, y mayúsculas da igual.
// eslint-disable-next-line no-control-regex -- justamente se buscan caracteres de control
const CTRL = /[\u0000-\u001f\u007f-\u009f]/g
// eslint-disable-next-line no-control-regex -- idem
const BLANKS = /[\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/g
const HREF_OK = /^(?:https?:\/\/|mailto:|tel:|\/(?![/\\])|#)/i
const SRC_OK = /^(?:https?:\/\/|\/(?![/\\]))/i

/** href seguro (http(s), mailto:, tel:, ruta `/`, ancla `#`) o `undefined` (el <a> queda sin href). */
export function safeHref(u) {
  if (typeof u !== 'string') return undefined
  const s = u.replace(CTRL, '').trim()
  if (!s) return undefined
  return HREF_OK.test(s.replace(BLANKS, '')) ? s : undefined
}

/** src/poster de <img>/<video>: misma regla que cssUrl (http(s) o `/`), o `undefined`. */
export function safeSrc(u) {
  if (typeof u !== 'string') return undefined
  const s = u.replace(CTRL, '').trim()
  if (!s) return undefined
  return SRC_OK.test(s.replace(BLANKS, '')) ? s : undefined
}

/** Longitud simple (radius, etc.): número finito (px) o `1.5em`/`8px`/`50%`; si no → `undefined`. */
export function cssLength(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string' && /^\s*-?\d*\.?\d+(?:px|em|rem|%|vh|vw|svh|dvh|cqw)?\s*$/.test(v)) return v.trim()
  return undefined
}

const OBJFIT_OK = new Set(['cover', 'contain', 'fill', 'none', 'scale-down'])
export const cssObjectFit = (f) => (typeof f === 'string' && OBJFIT_OK.has(f.trim()) ? f.trim() : undefined)

// ── z-index, aspect-ratio y lookups en tablas ────────────────────────────────────
/** z-index: entero finito o `undefined` (el navegador usa `auto`, igual que con el dato ausente). */
export function cssZIndex(n) {
  const v = cssNumber(n, NaN)
  return Number.isNaN(v) ? undefined : Math.trunc(v)
}

/** aspect-ratio: número positivo o `16 / 9` / `16/9`; si no → `undefined`. */
export function cssAspect(a) {
  if (typeof a === 'number') return Number.isFinite(a) && a > 0 ? a : undefined
  if (typeof a === 'string' && /^\s*\d*\.?\d+(?:\s*\/\s*\d*\.?\d+)?\s*$/.test(a)) return a.trim()
  return undefined
}

/** `tabla[clave]` sólo si es una clave PROPIA (`constructor`, `__proto__`… devuelven `undefined`). */
export function cssPick(tabla, clave) {
  return typeof clave === 'string' && Object.prototype.hasOwnProperty.call(tabla, clave) ? tabla[clave] : undefined
}
