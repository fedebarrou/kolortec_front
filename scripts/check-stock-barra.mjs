/**
 * check-stock-barra.mjs — la «barra de 3 segmentos» del stock (mockup 2026-10-20-stock, opción B).
 * Prueba la decisión pura de src/shared/utils/stock-barra.js y que el cableado/estilos respeten el mockup:
 *   alto 3 verdes «En stock» · medio 2 «Pocas unidades» · bajo 1 «Últimas unidades» · sin 0 «Sin stock» · null → nada ·
 *   medidas 18×6, gap 3, texto 13px/600 · colores sólo como variables de :root · i18n es/en.
 * Uso: node scripts/check-stock-barra.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decidirStockBarra, normalizarStockNivel } from '../src/shared/utils/stock-barra.js'
import { translations } from '../src/shared/i18n/translations.js'

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }
const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8')

const ESPERADO = [
  ['alto', 3, 'En stock'],
  ['medio', 2, 'Pocas unidades'],
  ['bajo', 1, 'Últimas unidades'],
  ['sin', 0, 'Sin stock'],
]
for (const [nivel, encendidos, texto] of ESPERADO) {
  caso(`${nivel} → ${encendidos} segmento(s) encendido(s) de 3 y «${texto}»`, () => {
    const d = decidirStockBarra(nivel)
    assert.equal(d.nivel, nivel)
    assert.equal(d.segmentos.length, 3)
    assert.deepEqual(d.segmentos, [0, 1, 2].map((i) => i < encendidos))
    assert.equal(d.encendidos, encendidos)
    assert.equal(d.texto, texto)
  })
}
for (const v of [null, undefined, '', 'mucho', 'ALTO', 3, {}, 'toString', '__proto__']) {
  caso(`${JSON.stringify(v)} → null (no se dibuja nada)`, () => {
    assert.equal(decidirStockBarra(v), null)
    assert.equal(normalizarStockNivel(v), null)
  })
}

const css = leer('src/index.css')
caso('colores como variables en :root: verde, naranja, rojo y segmento apagado', () => {
  for (const v of ['alto', 'medio', 'bajo', 'apagado']) assert.match(css, new RegExp(`--kt-stock-${v}:\\s*#[0-9a-fA-F]{6}`))
})
caso('las reglas .kt-stock* no llevan hex ni rgb sueltos', () => {
  const reglas = [...css.matchAll(/\.kt-stock[^{]*\{[^}]*\}/g)].map((m) => m[0])
  assert.ok(reglas.length >= 6, `esperaba ≥6 reglas, hay ${reglas.length}`)
  for (const r of reglas) assert.doesNotMatch(r, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, r)
})
caso('medidas del mockup: segmentos 18×6, gap 3, texto 13px/600', () => {
  const segs = css.match(/\.kt-stock-segs i\s*\{[^}]*\}/)[0]
  assert.match(segs, /width:\s*18px/)
  assert.match(segs, /height:\s*6px/)
  assert.match(css.match(/\.kt-stock-segs\s*\{[^}]*\}/)[0], /gap:\s*3px/)
  const tx = css.match(/\.kt-stock-tx\s*\{[^}]*\}/)[0]
  assert.match(tx, /font-size:\s*13px/)
  assert.match(tx, /font-weight:\s*600/)
})
caso('«Sin stock» con el texto apagado (--soft)', () => {
  assert.match(css, /\.kt-stock--sin \.kt-stock-tx\s*\{[^}]*color:\s*var\(--soft\)/)
})
caso('i18n es/en: las 4 claves stockBar.* existen en los dos idiomas', () => {
  for (const lang of ['es', 'en']) {
    for (const n of ['alto', 'medio', 'bajo', 'sin']) assert.ok(translations[lang]?.stockBar?.[n], `${lang}.stockBar.${n}`)
  }
  assert.equal(translations.es.stockBar.medio, 'Pocas unidades')
})
caso('cableado: la card y la ficha dibujan StockBarra; el adapter trae stock_nivel (producto, variante, presentación y detalle)', () => {
  assert.match(leer('src/features/catalog/components/ProductCard.jsx'), /<StockBarra nivel=\{item\.stockNivel\}/)
  assert.match(leer('src/features/product/pages/ProductDetailPage.jsx'), /<StockBarra nivel=\{presentacionElegida \? presentacionElegida\.stockNivel : product\.stockNivel\}/)
  assert.equal((leer('src/shared/services/contentService.js').match(/stock_nivel \?\? null/g) || []).length, 4)
})

console.log(`\nOK — ${ok} comprobaciones.`)
