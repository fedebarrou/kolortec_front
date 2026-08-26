/**
 * check-i18n-parity — que `en` y `es` tengan EXACTAMENTE las mismas rutas.
 *
 * Por qué existe: `t(ruta, fallback)` devuelve el fallback cuando la clave no
 * está, sin error y sin aviso (LanguageProvider.jsx). Una ruta que existe en un
 * idioma y no en el otro —o con un typo— no se ve como bug: se ve como "esta
 * parte no traduce". Ya pasó con `landing.join` y con el bloque `join`, que
 * nunca existieron y hacían que el teaser de Sumate y toda la página /sumate
 * salieran en castellano aunque el código pareciera internacionalizado.
 *
 * También detecta claves DUPLICADAS en un mismo objeto literal, donde la
 * segunda gana en silencio (el caso histórico de `header`).
 *
 *   node scripts/check-i18n-parity.mjs     → 0 si está OK, 1 si hay drift
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const file = resolve(here, '../src/shared/i18n/translations.js')

const { translations } = await import(pathToFileURL(file).href)

const rutas = (obj, prefijo = '') => {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...rutas(v, ruta))
    else out.push(ruta)
  }
  return out
}

let fallas = 0
const err = (msg) => { console.error('  ✗ ' + msg); fallas++ }

const idiomas = Object.keys(translations)
console.log(`idiomas: ${idiomas.join(', ')}`)

const porIdioma = Object.fromEntries(idiomas.map((l) => [l, new Set(rutas(translations[l]))]))
const base = idiomas[0]

for (const l of idiomas.slice(1)) {
  const faltanEn = [...porIdioma[base]].filter((r) => !porIdioma[l].has(r))
  const sobranEn = [...porIdioma[l]].filter((r) => !porIdioma[base].has(r))
  faltanEn.forEach((r) => err(`falta en '${l}': ${r}`))
  sobranEn.forEach((r) => err(`falta en '${base}': ${r}`))
}

// Claves duplicadas dentro de un mismo objeto: el parser se queda con la ÚLTIMA
// y la primera desaparece sin ruido. Se detecta sobre el texto, porque para
// cuando el módulo está importado el duplicado ya se perdió.
const texto = readFileSync(file, 'utf8')
for (const idioma of idiomas) {
  const re = new RegExp(`^  ${idioma}: \\{`, 'm')
  const desde = texto.search(re)
  if (desde < 0) continue
  const resto = texto.slice(desde)
  const fin = resto.search(/^  \},/m)
  const bloque = resto.slice(0, fin < 0 ? undefined : fin)
  // Un Set POR PADRE, no por nivel: `title` puede repetirse legítimamente en
  // objetos hermanos (landing.hero.title y landing.shop.title). Lo que se busca
  // es la misma clave dos veces DENTRO DEL MISMO objeto.
  const pila = [idioma]
  const porPadre = new Map()
  let sangriaArray = -1 // dentro de un array los elementos repiten claves a propósito
  for (const linea of bloque.split(/\r?\n/)) {
    const sangria = linea.match(/^\s*/)[0].length
    if (sangriaArray >= 0) {
      if (/^\s*\],?\s*$/.test(linea) && sangria === sangriaArray) sangriaArray = -1
      continue
    }
    const m = linea.match(/^(\s+)([a-zA-Z][\w]*):(.*)$/)
    if (!m) continue
    if (m[3].trim() === '[') { sangriaArray = m[1].length; continue }
    const nivel = Math.floor(m[1].length / 2)
    pila.length = nivel
    const padre = pila.join('.')
    pila[nivel] = m[2]
    if (!porPadre.has(padre)) porPadre.set(padre, new Set())
    const vistas = porPadre.get(padre)
    if (vistas.has(m[2])) err(`clave duplicada: ${padre}.${m[2]} (gana la última, la primera se pierde)`)
    vistas.add(m[2])
  }
}

// ── `t()` usado sin el hook en scope ─────────────────────────────────────────
// Este es el error que el build NO ve: `npm run build` compila feliz un archivo
// que llama a t() sin haber hecho `const { t } = useLanguage()`, y la página
// revienta con un ReferenceError recién al abrirla. Ya pasó tres veces.
const { readdirSync, statSync } = await import('node:fs')
const src = resolve(here, '../src')
const archivos = []
;(function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const p = resolve(dir, nombre)
    if (statSync(p).isDirectory()) recorrer(p)
    else if (/\.jsx?$/.test(nombre)) archivos.push(p)
  }
})(src)

const rel = (p) => p.slice(src.length + 1).replace(/\\/g, '/')

for (const p of archivos) {
  const texto = readFileSync(p, 'utf8')
  // Llamada a t('...') o t("..."), que es la única forma que usa el repo.
  if (!/[^.\w]t\(\s*['"]/.test(texto)) continue
  if (/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useLanguage\(\)/.test(texto)) continue
  err(`t() sin \`const { t } = useLanguage()\` en scope: ${rel(p)}`)
}

// ── Toda clave usada en el código tiene que RESOLVER ─────────────────────────
// Esta es la comprobación que de verdad protege, y la que faltaba: la paridad
// en/es no alcanza, porque una clave puede quedar mal anidada en LOS DOS
// idiomas por igual y entonces "coinciden" sin resolver. Pasó con
// `landing.join`, que terminó como clave de primer nivel: paridad en verde y
// el teaser de Sumate igual salía en castellano.
const resuelve = (lang, ruta) =>
  ruta.split('.').reduce((acc, parte) => (acc && acc[parte] != null ? acc[parte] : undefined), translations[lang]) != null

for (const p of archivos) {
  const texto = readFileSync(p, 'utf8')
  for (const m of texto.matchAll(/[^.\w]t\(\s*'([\w.]+)'/g)) {
    const ruta = m[1]
    const faltan = idiomas.filter((l) => !resuelve(l, ruta))
    if (faltan.length) err(`clave sin resolver en [${faltan.join(', ')}]: '${ruta}'  (${rel(p)})`)
  }
}

const total = porIdioma[base].size
if (fallas) {
  console.error(`\ni18n parity FAIL — ${fallas} problema(s) sobre ${total} rutas`)
  process.exit(1)
}
console.log(`i18n parity OK — ${total} rutas, idénticas en ${idiomas.length} idiomas`)
