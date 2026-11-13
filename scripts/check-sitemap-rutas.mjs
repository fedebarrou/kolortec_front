/**
 * check-sitemap-rutas.mjs — el sitemap no lista redirecciones ni páginas que no se indexan (13-nov-2026).
 *
 * Por qué existe: /distribuidores y /rentals estaban en el sitemap aunque App.jsx las redirige a /sumate, y /sumate
 * —la página real— no estaba. Y el cartel «Sitio en construcción» respondía sin `noindex`.
 *
 * Qué mira (sin red, sin navegador):
 *   · ninguna ruta estática del sitemap (src/data/routes.mjs) es una redirección de App.jsx (<Navigate …>);
 *   · toda ruta estática del sitemap existe como <Route path="…"> en App.jsx;
 *   · /sumate está y /login no;
 *   · el sitemap commiteado (public/sitemap.xml, el que se publica si el generador falla en el build) tampoco lista
 *     redirecciones;
 *   · MaintenancePage lleva <Seo … noindex>.
 * Uso: node scripts/check-sitemap-rutas.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const leer = (p) => readFileSync(resolve(raiz, p), 'utf8')

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }

// Las rutas estáticas se leen del fuente (routes.mjs importa la capa de datos, que pide la API: acá no hace falta).
const estaticas = [...leer('src/data/routes.mjs').matchAll(/\{\s*path:\s*'([^']+)'/g)].map((m) => m[1])
const app = leer('src/App.jsx')
const redirecciones = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate\b/g)].map((m) => m[1])
const rutasApp = new Set([...app.matchAll(/<Route\s+(?:index|path="([^"]+)")/g)].map((m) => m[1] ?? '/'))
const enSitemap = [...leer('public/sitemap.xml').matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/')

caso('se leyeron las rutas (el check no pasa en vacío)', () => {
  assert.ok(estaticas.length >= 8, `rutas estáticas: ${estaticas.length}`)
  assert.ok(redirecciones.length >= 2, `redirecciones en App.jsx: ${redirecciones.length}`)
  assert.ok(enSitemap.length >= 8, `URLs en public/sitemap.xml: ${enSitemap.length}`)
})

caso('ninguna ruta estática del sitemap es una redirección', () => {
  const malas = estaticas.filter((p) => redirecciones.includes(p))
  assert.deepEqual(malas, [])
})

caso('toda ruta estática del sitemap existe en App.jsx', () => {
  const faltan = estaticas.filter((p) => p !== '/' && !rutasApp.has(p))
  assert.deepEqual(faltan, [])
})

caso('/sumate está en el sitemap y /login no', () => {
  assert.ok(estaticas.includes('/sumate'))
  assert.ok(!estaticas.includes('/login'))
})

caso('el sitemap commiteado (public/sitemap.xml) no lista redirecciones y sí /sumate', () => {
  assert.deepEqual(enSitemap.filter((p) => redirecciones.includes(p)), [])
  assert.ok(enSitemap.includes('/sumate'))
})

caso('el cartel «Sitio en construcción» lleva noindex', () => {
  const m = leer('src/shared/components/MaintenancePage.jsx')
  assert.match(m, /<Seo\b[\s\S]*?\bnoindex\b[\s\S]*?\/>/)
})

// ── llms.txt: el índice para buscadores de IA tampoco enlaza redirecciones ──────────────────────────────────────────
const enlacesDe = (texto) => [...texto.matchAll(/\]\((?:https?:\/\/[^/)]+|', SITE, ')(\/[^)':]*)/g)].map((m) => m[1].replace(/\/$/, '') || '/')

caso('llms.txt (el commiteado y su generador) no enlaza redirecciones', () => {
  const publicado = enlacesDe(leer('public/llms.txt'))
  const generador = enlacesDe(leer('scripts/gen-llms-txt.mjs'))
  assert.ok(publicado.length >= 8, `enlaces en public/llms.txt: ${publicado.length}`)
  assert.ok(generador.length >= 5, `enlaces en el generador: ${generador.length}`)
  assert.deepEqual(publicado.filter((p) => redirecciones.includes(p)), [])
  assert.deepEqual(generador.filter((p) => redirecciones.includes(p)), [])
  assert.ok(publicado.includes('/sumate') && generador.includes('/sumate'))
})

// ── nginx: cada <Navigate> de App.jsx tiene su 301 real, al mismo destino ───────────────────────────────────────────
caso('cada redirección de App.jsx tiene su 301 en deploy/nginx-spa.conf, al mismo destino', () => {
  const deApp = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate\s+to="([^"]+)"/g)].map((m) => [m[1], m[2]])
  const nginx = leer('deploy/nginx-spa.conf')
  const reglas = [...nginx.matchAll(/location\s+=\s+(\S+)\s*\{\s*return\s+301\s+([^\s;$]+)(\$is_args\$args)?;\s*\}/g)]
  const deNginx = new Map(reglas.map((m) => [m[1], m[2]]))
  // heimdall INF-002: el 301 conserva la query (utm, ?preview=…); INF-001: no se cachea para siempre
  assert.deepEqual(reglas.filter((m) => !m[3]).map((m) => m[1]), [], 'todos los 301 llevan $is_args$args')
  assert.match(nginx, /^\s*add_header\s+Cache-Control\s+"max-age=86400"\s+always;/m)
  // /términos queda afuera: nginx compara la ruta ya decodificada y una ruta con tilde en la conf es frágil; la
  // sigue resolviendo App.jsx.
  const esperadas = deApp.filter(([p]) => /^[\x21-\x7e]+$/.test(p))
  assert.ok(esperadas.length >= 8, `redirecciones ASCII en App.jsx: ${esperadas.length}`)
  const faltan = esperadas.filter(([p, a]) => deNginx.get(p) !== a).map(([p, a]) => `${p} → ${a}`)
  assert.deepEqual(faltan, [])
  const sobran = [...deNginx.keys()].filter((p) => !deApp.some(([q]) => q === p))
  assert.deepEqual(sobran, [])
  assert.match(nginx, /absolute_redirect\s+off;/)
  // ningún 301 pisa una página real
  assert.deepEqual([...deNginx.keys()].filter((p) => estaticas.includes(p)), [])
})

// ── idioma: español salvo elección explícita ────────────────────────────────────────────────────────────────────────
caso('el idioma inicial no sale del navegador y sólo se guarda al elegirlo', () => {
  const lp = leer('src/shared/i18n/LanguageProvider.jsx').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
  assert.doesNotMatch(lp, /navigator\.language/)
  assert.equal([...lp.matchAll(/localStorage\.setItem/g)].length, 1, 'un solo setItem')
  assert.match(lp, /const setLang = [\s\S]*?localStorage\.setItem[\s\S]*?setLangState\(nextLang\)/)
  assert.doesNotMatch(lp, /'kolortec-lang'/, 'la clave vieja guardaba el idioma deducido: no se lee')
})

// ── título de la ficha: producto · categoría · marca ────────────────────────────────────────────────────────────────
const { tituloSeoProducto } = await import('../src/shared/seo/titulo-producto.js')

caso('el título de la ficha lleva la categoría, sin repetirla', () => {
  assert.equal(tituloSeoProducto('KT-350 Beam', 'Cabezales móviles'), 'KT-350 Beam · Cabezales móviles · Kolortec')
  assert.equal(tituloSeoProducto('Cabezal móvil KT-350', 'Cabezales Moviles'), 'Cabezal móvil KT-350 · Kolortec')
  assert.equal(tituloSeoProducto('Strobe 1000', 'Strobes'), 'Strobe 1000 · Kolortec')
  assert.equal(tituloSeoProducto('KT-350', ''), 'KT-350 · Kolortec')
  assert.equal(tituloSeoProducto('KT-350', undefined), 'KT-350 · Kolortec')
  assert.equal(tituloSeoProducto('  KT-350  ', '  Barras LED '), 'KT-350 · Barras LED · Kolortec')
  assert.equal(tituloSeoProducto('', 'Barras LED'), 'Kolortec')
  // categorías cortas y de sólo símbolos (joan REG-001)
  assert.equal(tituloSeoProducto('DJ Spot', 'DJ'), 'DJ Spot · Kolortec')
  assert.equal(tituloSeoProducto('KT-350', '—'), 'KT-350 · Kolortec')
  assert.equal(tituloSeoProducto('Barra de LED 8', 'Barras De Led'), 'Barra de LED 8 · Kolortec')
  // una palabra de la categoría no alcanza: tienen que estar todas
  assert.equal(tituloSeoProducto('Panel LED 600', 'Barras LED'), 'Panel LED 600 · Barras LED · Kolortec')
})

caso('la ficha usa ese título', () => {
  assert.match(leer('src/features/product/pages/ProductDetailPage.jsx'), /title=\{tituloSeoProducto\(product\.name, categoriaNombre\)\}/)
})

console.log(`check-sitemap-rutas: ${ok} casos OK`)
