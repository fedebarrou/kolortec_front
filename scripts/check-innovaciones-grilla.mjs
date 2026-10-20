/**
 * check-innovaciones-grilla.mjs — la grilla de innovaciones de la ficha (20-oct-2026, opción B).
 * Prueba src/shared/utils/innovaciones-grilla.js: la grilla aparece desde la 5.ª (4 o menos = lista de siempre),
 * páginas de 6 (2×3) en celular y la página visible según el scroll.
 * Uso: node scripts/check-innovaciones-grilla.mjs
 */
import assert from 'node:assert/strict'
import { UMBRAL_LISTA, POR_PAGINA, usaGrilla, paginar, paginaDesdeScroll, conGuiones } from '../src/shared/utils/innovaciones-grilla.js'

const GS = '­'
let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }
const lista = (n) => Array.from({ length: n }, (_, i) => ({ title: `I${i + 1}` }))

caso('constantes del mockup: umbral 4, páginas de 6', () => {
  assert.equal(UMBRAL_LISTA, 4)
  assert.equal(POR_PAGINA, 6)
})
for (const n of [0, 1, 2, 3, 4]) {
  caso(`${n} innovaciones → lista de siempre (sin grilla)`, () => assert.equal(usaGrilla(n), false))
}
for (const n of [5, 6, 7, 20, 100]) {
  caso(`${n} innovaciones → grilla`, () => assert.equal(usaGrilla(n), true))
}
caso('cantidad inválida → sin grilla', () => {
  assert.equal(usaGrilla(undefined), false)
  assert.equal(usaGrilla(NaN), false)
  assert.equal(usaGrilla(null), false)
})
caso('paginar: 20 → 6+6+6+2, en orden y sin perder ninguna', () => {
  const p = paginar(lista(20))
  assert.deepEqual(p.map((x) => x.length), [6, 6, 6, 2])
  assert.deepEqual(p.flat().map((x) => x.title), lista(20).map((x) => x.title))
})
caso('paginar: 5 → 1 página de 5; 6 → 1 página; 7 → 6+1; 12 → 6+6', () => {
  assert.deepEqual(paginar(lista(5)).map((x) => x.length), [5])
  assert.deepEqual(paginar(lista(6)).map((x) => x.length), [6])
  assert.deepEqual(paginar(lista(7)).map((x) => x.length), [6, 1])
  assert.deepEqual(paginar(lista(12)).map((x) => x.length), [6, 6])
})
caso('paginar: vacío o inválido → []', () => {
  assert.deepEqual(paginar([]), [])
  assert.deepEqual(paginar(undefined), [])
  assert.deepEqual(paginar(null), [])
})
caso('paginar: no muta la lista original', () => {
  const l = lista(8)
  paginar(l)
  assert.equal(l.length, 8)
})
const sc = (scrollLeft, extra = {}) => ({ paso: 300, clientWidth: 330, scrollWidth: 1230, total: 4, scrollLeft, ...extra })
caso('paginaDesdeScroll: 0 → página 0; mitad de camino redondea al más cercano', () => {
  assert.equal(paginaDesdeScroll(sc(0)), 0)
  assert.equal(paginaDesdeScroll(sc(100)), 0)
  assert.equal(paginaDesdeScroll(sc(160)), 1)
  assert.equal(paginaDesdeScroll(sc(300)), 1)
  assert.equal(paginaDesdeScroll(sc(600)), 2)
})
caso('paginaDesdeScroll: scroll agotado → última página aunque no alinee', () => {
  assert.equal(paginaDesdeScroll(sc(900)), 3) // 900 + 330 >= 1230 - 2
  assert.equal(paginaDesdeScroll(sc(880)), 3)
})
caso('paginaDesdeScroll: una sola página, o datos inválidos → 0; nunca se pasa del rango', () => {
  assert.equal(paginaDesdeScroll(sc(500, { total: 1 })), 0)
  assert.equal(paginaDesdeScroll(sc(500, { paso: 0 })), 0)
  assert.equal(paginaDesdeScroll(sc(-50)), 0)
  assert.equal(paginaDesdeScroll(sc(5000, { scrollWidth: 99999 })), 3)
})

const sil = (t) => conGuiones(t).split(GS).join('-')
caso('conGuiones: silabea palabras largas (REFRIGERACIÓN, MONOBLOQUE, ANTIRREFLEJANTE)', () => {
  assert.equal(sil('REFRIGERACIÓN'), 'RE-FRI-GE-RA-CIÓN')
  assert.equal(sil('MONOBLOQUE'), 'MO-NO-BLO-QUE')
  assert.equal(sil('ANTIRREFLEJANTE'), 'AN-TI-RRE-FLE-JANTE')
})
caso('conGuiones: palabras cortas, números y texto sin letras no se tocan; sólo suma guiones suaves', () => {
  assert.equal(conGuiones('CHASIS'), 'CHASIS')
  assert.equal(conGuiones('12345678901'), '12345678901')
  assert.equal(conGuiones(undefined), undefined)
  for (const t of ['SISTEMA DE REFRIGERACIÓN ACTIVA', 'Batería de larga duración', 'ELECTROMAGNETISMO']) assert.equal(conGuiones(t).split(GS).join(''), t)
})
caso('conGuiones: nunca deja una sílaba suelta de menos de 2 letras (la última, 3)', () => {
  for (const f of conGuiones('AUTOMATIZACIÓN EXTRAORDINARIA ESCUELA TEATRALIDAD ÍÍÍÍÍÍÍÍÍ').split(/\s+/)) { const ps = f.split(GS); ps.forEach((parte, i) => assert.ok(parte.length >= (i === ps.length - 1 && ps.length > 1 ? 3 : 2), parte)) }
})

console.log(`\n${ok} casos OK`)
