/**
 * check-marcas-nombre.mjs — «Nombre de la marca» en la tira de marcas (name_position, 20-oct-2026).
 * Prueba la decisión pura de src/shared/utils/marcas-nombre.js, que es la que usa PartnersStrip:
 *   null / derecha → nombre visible a la derecha y clase de siempre · no → sin nombre, alt + title + aria-label ·
 *   abajo → clase --abajo · marca sin logo → conserva el nombre · valor inválido → como siempre.
 * Uso: node scripts/check-marcas-nombre.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decidirNombreMarca, normalizarNamePosition } from '../src/shared/utils/marcas-nombre.js'

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }
const BASE = 'kt-marquee-item-clientlogo'
const conLogo = (namePosition) => ({ name: 'Audioluz', logo: '/a.webp', namePosition })

for (const pos of [null, undefined, 'derecha']) {
  caso(`name_position ${pos} → nombre visible a la derecha y clase de siempre`, () => {
    const d = decidirNombreMarca(conLogo(pos))
    assert.equal(d.mostrarNombre, true)
    assert.equal(d.ocultarNombre, false)
    assert.equal(d.itemClass, BASE)
    assert.equal(d.alt, '')
    assert.equal(d.title, undefined)
    assert.equal(d.ariaLabel, undefined)
  })
}
caso("'no' → sin nombre; el nombre queda en alt, title y aria-label; clase de siempre", () => {
  const d = decidirNombreMarca(conLogo('no'))
  assert.equal(d.mostrarNombre, false)
  assert.equal(d.itemClass, BASE)
  assert.equal(d.alt, 'Audioluz')
  assert.equal(d.title, 'Audioluz')
  assert.equal(d.ariaLabel, 'Audioluz')
})
caso("'abajo' → nombre visible y clase --abajo", () => {
  const d = decidirNombreMarca(conLogo('abajo'))
  assert.equal(d.mostrarNombre, true)
  assert.equal(d.itemClass, `${BASE} ${BASE}--abajo`)
  assert.equal(d.alt, '')
})
caso("marca sin logo ni shapes conserva su nombre aunque sea 'no', y 'abajo' no la pasa a columna", () => {
  assert.equal(decidirNombreMarca({ name: 'X', logo: null, namePosition: 'no' }).mostrarNombre, true)
  assert.equal(decidirNombreMarca({ name: 'X', logo: null, namePosition: 'abajo' }).itemClass, BASE)
})
caso("una marca con shapes (demo) cuenta como marca: 'no' oculta el nombre", () => {
  assert.equal(decidirNombreMarca({ name: 'X', shapes: [{ type: 'circle' }], namePosition: 'no' }).ocultarNombre, true)
})
caso('valor inválido → como siempre', () => {
  assert.equal(normalizarNamePosition('izquierda'), null)
  assert.equal(decidirNombreMarca(conLogo('centro')).mostrarNombre, true)
  assert.deepEqual(['no', 'derecha', 'abajo'].map(normalizarNamePosition), ['no', 'derecha', 'abajo'])
})
caso('PartnersStrip usa la función y contentService normaliza con la misma', () => {
  const strip = readFileSync(new URL('../src/features/landing/components/PartnersStrip.jsx', import.meta.url), 'utf8')
  const svc = readFileSync(new URL('../src/shared/services/contentService.js', import.meta.url), 'utf8')
  assert.match(strip, /decidirNombreMarca\(logo\)/)
  assert.match(svc, /normalizarNamePosition\(webConfig\?\.section_card_styles\?\.marcas\?\.name_position\)/)
})

console.log(`\ncheck-marcas-nombre: ${ok} casos OK`)
