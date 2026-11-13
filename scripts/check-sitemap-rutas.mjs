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

console.log(`check-sitemap-rutas: ${ok} casos OK`)
