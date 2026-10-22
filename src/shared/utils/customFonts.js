// Fuentes propias de la cuenta (Mi web › Apariencia › appearance.custom_fonts). ESPEJO de mapCustomFonts (tiendita-store/lib/api.js) y
// de customFontFaceCss / safeCssUrl (tiendita-store/lib/appearance.js): el renderer del hero referencia estas fuentes por su id
// `cf` + 8 hex (font-family: "cf1a2b3c4d") y heroFonts.js NUNCA las pide a Google — sin este @font-face el navegador cae al
// fallback y el hero se ve en otra tipografía que en el Lab. Si cambia allá, cambiar acá.

const CUSTOM_FONT_ID_RE = /^cf[0-9a-f]{8}$/
const CUSTOM_FONT_FORMATS = ['woff2', 'woff', 'truetype', 'opentype']
const CUSTOM_FONT_STYLES = ['normal', 'italic']
const CUSTOM_FONTS_MAX = 3

/** URL http(s) o ruta interna sin caracteres que rompan el CSS (única puerta por donde la url entra a un <style>). */
export function safeCssUrl(u) {
  const s = String(u || '').trim()
  if (/^(https?:\/\/|\/(?!\/))[^\s"'()\\<>]+$/i.test(s)) return s
  return null
}

/** Normaliza appearance.custom_fonts: descarta en silencio lo mal formado. */
export function mapCustomFonts(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = typeof item.id === 'string' ? item.id.trim().toLowerCase() : ''
    if (!CUSTOM_FONT_ID_RE.test(id) || seen.has(id)) continue
    const label = typeof item.label === 'string' ? item.label.trim().slice(0, 40) : ''
    if (!label) continue
    const url = typeof item.url === 'string' ? item.url.trim() : ''
    if (!url) continue
    if (!CUSTOM_FONT_FORMATS.includes(item.format)) continue
    const weightNum = Number(item.weight)
    if (!Number.isFinite(weightNum) || weightNum < 100 || weightNum > 900 || weightNum % 100 !== 0) continue
    if (!CUSTOM_FONT_STYLES.includes(item.style)) continue
    seen.add(id)
    out.push({ id, label, url, format: item.format, weight: Math.round(weightNum), style: item.style })
    if (out.length >= CUSTOM_FONTS_MAX) break
  }
  return out
}

/** Un @font-face por fuente propia válida. */
export function customFontFaceCss(fonts) {
  if (!Array.isArray(fonts) || !fonts.length) return ''
  const blocks = []
  for (const f of fonts) {
    if (!f || typeof f !== 'object') continue
    const id = typeof f.id === 'string' ? f.id.trim().toLowerCase() : ''
    if (!CUSTOM_FONT_ID_RE.test(id)) continue
    const url = safeCssUrl(f.url)
    if (!url) continue
    const format = CUSTOM_FONT_FORMATS.includes(f.format) ? f.format : null
    if (!format) continue
    const weightNum = Number(f.weight)
    const weight = Number.isFinite(weightNum) && weightNum >= 100 && weightNum <= 900 ? Math.round(weightNum) : 400
    const style = CUSTOM_FONT_STYLES.includes(f.style) ? f.style : 'normal'
    blocks.push(`@font-face{font-family:"${id}";src:url("${url}") format("${format}");font-weight:${weight};font-style:${style};font-display:swap;}`)
  }
  return blocks.join('\n')
}
