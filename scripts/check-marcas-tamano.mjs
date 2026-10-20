/**
 * check-marcas-tamano.mjs — la fórmula del tamaño de las marcas (tira de «Marcas»).
 *
 * Decisión del 17-oct-2026 (docs/diseno/DECISIONES-VISUALES.md): cada logo se iguala por ÁREA con la raíz de
 * su proporción natural, con topes, y se retoca con la `escala` de la marca (0,70–1,40; por defecto 1).
 * La función (src/shared/utils/marcas-tamano.js) es la MISMA COPIA que tiene tiendita en
 * tiendita-front/lib y tiendita-store/lib: si se cambia una, se cambian las tres IDÉNTICAS.
 *
 *   node scripts/check-marcas-tamano.mjs
 *
 * Además de probar la función compara el TEXTO con la copia de tiendita-store/lib (OBLIGATORIA: si el repo no
 * está en ../tiendita el check FALLA, no se saltea) y con la de tiendita-front/lib si existe.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALTO_BASE,
  ESCALA_DEFECTO,
  ESCALA_MAX,
  ESCALA_MIN,
  medirLogo,
  normalizarEscala,
  proporcionNatural,
} from '../src/shared/utils/marcas-tamano.js'

const aqui = dirname(fileURLToPath(import.meta.url))
let ok = 0
const caso = (nombre, fn) => {
  fn()
  ok += 1
  console.log(`  ✔ ${nombre}`)
}

caso('base de la tira = 83px (72 + 15 %, 20-oct-2026)', () => {
  assert.equal(ALTO_BASE.tira, 83)
  // Un logo 2,5:1 es la referencia: mide exactamente el alto base.
  assert.deepEqual(medirLogo({ proporcion: 2.5, contexto: 'tira' }), { w: 208, h: 83 })
})

caso('a igual escala, proporciones distintas quedan con la misma ÁREA (±3 %) dentro de los topes', () => {
  const areas = [1.5, 2.5, 3, 4, 5].map((r) => {
    const { w, h } = medirLogo({ proporcion: r, contexto: 'tira' })
    return w * h
  })
  const media = areas.reduce((a, b) => a + b, 0) / areas.length
  for (const a of areas) assert.ok(Math.abs(a - media) / media < 0.03, `área ${a} lejos de ${media}`)
})

caso('topes: alto entre 62 % y 130 % del base, ancho a 3,7× el base', () => {
  assert.equal(medirLogo({ proporcion: 0.2, contexto: 'tira' }).h, Math.round(83 * 1.3)) // muy alto y angosto
  assert.equal(medirLogo({ proporcion: 10, contexto: 'tira' }).w, Math.round(83 * 3.7)) // muy ancho y bajo
  assert.equal(medirLogo({ proporcion: 4, contexto: 'tira' }).h >= Math.round(83 * 0.62), true)
})

caso('la escala multiplica la medida y se acota a 0,70–1,40', () => {
  const a = medirLogo({ proporcion: 1, contexto: 'tira' })
  const b = medirLogo({ proporcion: 1, escala: 1.25, contexto: 'tira' })
  assert.ok(Math.abs(b.h / a.h - 1.25) < 0.02)
  assert.equal(normalizarEscala(5), ESCALA_MAX)
  assert.equal(normalizarEscala(0.1), ESCALA_MIN)
  assert.equal(normalizarEscala('1,2'), 1.2)
})

caso('escala ausente o basura vale 1', () => {
  for (const v of [undefined, null, '', 'x', NaN, 0, -3]) assert.equal(normalizarEscala(v), ESCALA_DEFECTO)
  assert.deepEqual(medirLogo({ proporcion: 3, contexto: 'tira' }), medirLogo({ proporcion: 3, escala: 'x', contexto: 'tira' }))
})

caso('sin proporción conocida sólo se escala el alto (el ancho sale solo)', () => {
  assert.deepEqual(medirLogo({ proporcion: null, contexto: 'tira' }), { w: null, h: 83 })
  assert.deepEqual(medirLogo({ proporcion: null, escala: 1.4, contexto: 'tira' }), { w: null, h: 116 })
  assert.equal(proporcionNatural(0, 0), null)
  assert.equal(proporcionNatural(300, 100), 3)
})

// Con base 83 (20-oct-2026) el logo más alto con escala máxima mide 151px: ya no entra en los 134px del item, que por
// eso pasó de height a min-height (src/index.css, .kt-marquee-item-clientlogo): crece sólo si hace falta.
caso('con escala máxima el logo más alto mide a lo sumo 151px (83 × 1,3 × 1,4) y el item de la tira crece para alojarlo', () => {
  const { h } = medirLogo({ proporcion: 0.2, escala: ESCALA_MAX, contexto: 'tira' })
  assert.ok(h <= Math.round(83 * 1.3 * ESCALA_MAX), `alto ${h} > ${Math.round(83 * 1.3 * ESCALA_MAX)}`)
})

// Misma copia que tiendita. La de la tienda es OBLIGATORIA: si no está a mano el check FALLA (antes avisaba
// y seguía, y un check que se saltea solo da verde justo cuando no tiene con qué comparar). La del front de
// tiendita se compara si existe.
const leer = (ruta) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')
const mia = leer(resolve(aqui, '../src/shared/utils/marcas-tamano.js'))
const tienda = resolve(aqui, '../../tiendita/tiendita-store/lib/marcas-tamano.js')
const front = resolve(aqui, '../../tiendita/tiendita-front/lib/marcas-tamano.js')

caso('la copia de tiendita-store/lib/marcas-tamano.js EXISTE (sin ella no hay con qué comparar)', () => {
  assert.ok(
    existsSync(tienda),
    `no se encuentra ${tienda}: sin la copia de la tienda no se puede probar que las tres son idénticas. ` +
      'Dejá el repo de tiendita en ../tiendita (carpeta hermana de kolortec).',
  )
})

caso('el texto es IDÉNTICO al de tiendita-store/lib/marcas-tamano.js', () => {
  assert.equal(mia, leer(tienda))
})

if (existsSync(front)) {
  caso('el texto es IDÉNTICO al de tiendita-front/lib/marcas-tamano.js', () => {
    assert.equal(mia, leer(front))
  })
} else {
  console.log('  · (no hay tiendita-front/lib/marcas-tamano.js: no se compara esa copia)')
}

console.log(`\ncheck-marcas-tamano: ${ok} casos OK`)
