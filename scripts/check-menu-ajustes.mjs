/**
 * check-menu-ajustes.mjs — el menú de arriba sigue los ajustes de la cuenta (20-oct-2026).
 * Prueba la decisión pura de src/shared/utils/menu-ajustes.js, la que usa HeaderSection:
 *   sin `ajustes` (back viejo) → el menú de siempre · sección apagada → el ítem desaparece ·
 *   sección en `menu.ocultas` → desaparece · Inicio y Soporte no dependen de ninguna sección.
 * Uso: node scripts/check-menu-ajustes.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { filtrarMenu, itemVisible, valoresDeAjustes } from '../src/shared/utils/menu-ajustes.js'

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }
const MENU = [
  { id: 'home', to: '/' },
  { id: 'catalog', to: '/products' },
  { id: 'services', to: '/servicios' },
  { id: 'support', to: '/descargas' },
]
const ids = (items) => items.map((i) => i.id).join(',')
const TODOS = 'home,catalog,services,support'
const ajustes = (valores) => ({ version: 1, valores: { tienda: true, servicios: true, 'menu.ocultas': [], ...valores } })

for (const sin of [undefined, null, {}, { version: 1 }, { valores: null }, { valores: [] }, 'x']) {
  caso(`sin ajustes utilizables (${JSON.stringify(sin)}) → el menú de siempre`, () => {
    assert.equal(filtrarMenu(MENU, sin), MENU)
    assert.equal(ids(filtrarMenu(MENU, sin)), TODOS)
  })
}
caso('todo encendido y sin ocultas → los 4 ítems', () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({}))), TODOS)
})
caso('servicios:false → desaparece «Servicios» y nada más', () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ servicios: false }))), 'home,catalog,support')
})
caso('tienda:false → desaparece «Productos»', () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ tienda: false }))), 'home,services,support')
})
caso("menu.ocultas ['servicios'] → desaparece «Servicios» aunque la sección esté prendida", () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ 'menu.ocultas': ['servicios'] }))), 'home,catalog,support')
})
caso("menu.ocultas ['productos'] → desaparece «Productos» (el nombre del back, no el de la ruta)", () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ 'menu.ocultas': ['productos'] }))), 'home,services,support')
})
caso('apagada Y oculta a la vez → desaparece una sola vez', () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ servicios: false, 'menu.ocultas': ['servicios'] }))), 'home,catalog,support')
})
caso('ocultas de secciones que el menú no tiene (hero, galeria, blog…) no sacan nada', () => {
  assert.equal(ids(filtrarMenu(MENU, ajustes({ 'menu.ocultas': ['hero', 'galeria', 'blog', 'contacto'] }))), TODOS)
})
caso('Inicio y Soporte nunca dependen de una sección', () => {
  const todoApagado = ajustes({ tienda: false, servicios: false, 'menu.ocultas': ['hero', 'productos', 'servicios'] })
  assert.equal(ids(filtrarMenu(MENU, todoApagado)), 'home,support')
})
caso('claves ausentes o con tipo raro no apagan nada (sólo `false` apaga; `ocultas` no-lista se ignora)', () => {
  assert.equal(itemVisible('services', { valores: {} }), true)
  assert.equal(itemVisible('services', { valores: { servicios: 0 } }), true)
  assert.equal(itemVisible('services', { valores: { 'menu.ocultas': 'servicios' } }), true)
  assert.equal(itemVisible('catalog', { valores: { tienda: null } }), true)
})
caso('la clave es PLANA con puntos: una ruta anidada no cuenta', () => {
  assert.equal(itemVisible('services', { valores: { menu: { ocultas: ['servicios'] } } }), true)
})
caso('valoresDeAjustes sólo devuelve objetos', () => {
  assert.deepEqual(valoresDeAjustes({ valores: { a: 1 } }), { a: 1 })
  assert.equal(valoresDeAjustes({ valores: [1] }), null)
})
caso('no muta la lista de entrada', () => {
  const copia = JSON.stringify(MENU)
  filtrarMenu(MENU, ajustes({ servicios: false }))
  assert.equal(JSON.stringify(MENU), copia)
})

// Cableado: HeaderSection usa la función pura y getAjustes; contentService lee `ajustes` del mismo web-config.
const header = readFileSync(new URL('../src/features/landing/components/HeaderSection.jsx', import.meta.url), 'utf8')
const servicio = readFileSync(new URL('../src/shared/services/contentService.js', import.meta.url), 'utf8')
caso('HeaderSection filtra navItems con filtrarMenu(…, ajustes) y los pide con getAjustes(); las 4 rutas siguen', () => {
  assert.match(header, /filtrarMenu\(/)
  assert.match(header, /getAjustes\(\)/)
  for (const ruta of ["'/'", "'/products'", "'/servicios'", "'/descargas'"]) assert.ok(header.includes(`to: ${ruta}`), `falta ${ruta}`)
})
caso('getAjustes lee cfg.ajustes de webConfigPath() (la misma promesa cacheada que getSiteConfig)', () => {
  assert.match(servicio, /export async function getAjustes\(\)[\s\S]{0,200}webConfigPath\(\)[\s\S]{0,120}cfg\?\.ajustes/)
})

console.log(`\nOK — ${ok} comprobaciones.`)
