/**
 * check-quitar-fondo.mjs — el fondo liso de las imágenes de innovaciones se vuelve transparente (13-nov-2026).
 * Prueba la función pura src/shared/utils/quitar-fondo.js, que es la que usa InnovacionIcono sobre los píxeles
 * leídos en un canvas: fondo negro, blanco y de color → transparente; dibujo → queda opaco y con su color;
 * borde suavizado → semitransparente y SIN halo del fondo; foto / fondo no liso / ya transparente → no se toca.
 * Uso: node scripts/check-quitar-fondo.mjs
 */
import assert from 'node:assert/strict'
import { quitarFondo, fondoDeEsquinas } from '../src/shared/utils/quitar-fondo.js'

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }

/** Imagen w×h con `fondo` y, encima, lo que pinte `dibujar(x, y)` (devuelve [r,g,b,a] o null). */
function imagen(w, h, fondo, dibujar = () => null) {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = dibujar(x, y) || fondo
      d.set([p[0], p[1], p[2], p[3] ?? 255], (y * w + x) * 4)
    }
  }
  return d
}
const px = (d, w, x, y) => Array.from(d.slice((y * w + x) * 4, (y * w + x) * 4 + 4))
const W = 40
const H = 24
const AMARILLO = [244, 223, 51]
const cuadrado = (x, y) => (x >= 12 && x < 28 && y >= 6 && y < 18 ? AMARILLO : null)

for (const [nombre, fondo] of [['negro', [0, 0, 0]], ['blanco', [255, 255, 255]], ['gris', [42, 42, 46]], ['rojo', [200, 30, 30]]]) {
  caso(`fondo ${nombre} → transparente; el dibujo queda opaco y con su color`, () => {
    const d = imagen(W, H, fondo, cuadrado)
    assert.equal(quitarFondo(d, W, H), 'quitado')
    assert.equal(px(d, W, 0, 0)[3], 0, 'esquina')
    assert.equal(px(d, W, 5, 12)[3], 0, 'fondo al costado del dibujo')
    assert.deepEqual(px(d, W, 20, 12), [...AMARILLO, 255], 'centro del dibujo')
  })
}

caso('ruido de JPG en el fondo (±8 por canal) → igual transparente', () => {
  let n = 0
  const d = imagen(W, H, [0, 0, 0], (x, y) => cuadrado(x, y) || [(n += 3) % 9, (n * 7) % 9, (n * 5) % 9])
  assert.equal(quitarFondo(d, W, H), 'quitado')
  assert.equal(px(d, W, 3, 3)[3], 0)
  assert.equal(px(d, W, 37, 20)[3], 0)
})

caso('borde suavizado sobre BLANCO → semitransparente y sin halo claro (se le saca el blanco que traía)', () => {
  // un píxel mitad dibujo rojo (220,30,30), mitad fondo blanco = rosa (238,143,143)
  const ROJO = [220, 30, 30]
  const d = imagen(W, H, [255, 255, 255], (x, y) => (x === 12 && y >= 6 && y < 18 ? [238, 143, 143] : x > 12 && x < 28 && y >= 6 && y < 18 ? ROJO : null))
  assert.equal(quitarFondo(d, W, H), 'quitado')
  const [r, g, b, a] = px(d, W, 12, 12)
  assert.ok(a > 0 && a < 255, `alfa intermedio, fue ${a}`)
  assert.ok(g < 120 && b < 120, `el color tira al dibujo (rojo), no al rosa de la mezcla (143): ${r},${g},${b}`)
  // apoyado sobre negro (lo más parecido a la tarjeta), ese píxel aporta bastante menos blanco que el rosa del archivo
  assert.ok((g * a) / 255 < 90, `sobre negro el verde se ve ${Math.round((g * a) / 255)}`)
  assert.deepEqual(px(d, W, 20, 12), [...ROJO, 255])
})

caso('fondo CLARO con dibujo OSCURO → no se toca (sin el fondo no se vería sobre la tarjeta oscura)', () => {
  for (const [fondo, tinta] of [[[255, 255, 255], [0, 0, 0]], [[255, 255, 255], [34, 34, 34]], [[230, 230, 225], [20, 30, 70]]]) {
    const d = imagen(W, H, fondo, (x, y) => (cuadrado(x, y) ? tinta : null))
    const antes = Array.from(d)
    assert.equal(quitarFondo(d, W, H), 'dibujo-oscuro')
    assert.deepEqual(Array.from(d), antes)
  }
})

caso('fondo OSCURO con dibujo oscuro, o fondo claro con dibujo de color → sí se quita', () => {
  const a = imagen(W, H, [0, 0, 0], (x, y) => (cuadrado(x, y) ? [70, 70, 70] : null))
  assert.equal(quitarFondo(a, W, H), 'quitado')
  const b = imagen(W, H, [255, 255, 255], (x, y) => (cuadrado(x, y) ? [220, 30, 30] : null))
  assert.equal(quitarFondo(b, W, H), 'quitado')
})

caso('el fondo ENCERRADO en el dibujo (el hueco de una «O») también se va', () => {
  const anillo = (x, y) => (x >= 10 && x < 30 && y >= 4 && y < 20 && !(x >= 16 && x < 24 && y >= 9 && y < 15) ? AMARILLO : null)
  const d = imagen(W, H, [0, 0, 0], anillo)
  assert.equal(quitarFondo(d, W, H), 'quitado')
  assert.equal(px(d, W, 20, 12)[3], 0, 'hueco')
  assert.equal(px(d, W, 12, 12)[3], 255, 'anillo')
})

caso('foto (cada esquina de un color) → no se toca', () => {
  const d = imagen(W, H, [0, 0, 0], (x, y) => [x * 6, y * 10, (x + y) * 3])
  const antes = Array.from(d)
  assert.equal(quitarFondo(d, W, H), 'sin-fondo-liso')
  assert.deepEqual(Array.from(d), antes)
})

caso('esquinas iguales pero el borde NO es liso (dibujo que llega a los bordes) → no se toca', () => {
  // franja ancha que cruza de lado a lado: un tercio del perímetro no es fondo (el tope es 25 %)
  const d = imagen(W, H, [0, 0, 0], (x, y) => (y >= 2 && y < 22 ? AMARILLO : null))
  const antes = Array.from(d)
  assert.equal(quitarFondo(d, W, H), 'sin-fondo-liso')
  assert.deepEqual(Array.from(d), antes)
})

caso('un dibujo que toca los bordes en un tramo corto (como los archivos reales) → igual se quita el fondo', () => {
  const d = imagen(W, H, [0, 0, 0], (x, y) => (x >= 14 && x < 26 ? AMARILLO : null)) // columna de arriba a abajo: 24 de 124 px del borde
  assert.equal(quitarFondo(d, W, H), 'quitado')
  assert.equal(px(d, W, 2, 12)[3], 0)
  assert.equal(px(d, W, 20, 0)[3], 255)
})

caso('un dibujo que toca UNA esquina no cambia el fondo detectado (3 de 4 esquinas)', () => {
  const d = imagen(W, H, [255, 255, 255], (x, y) => (x < 3 && y < 3 ? AMARILLO : cuadrado(x, y)))
  assert.deepEqual(fondoDeEsquinas(d, W, H).color.slice(0, 3), [255, 255, 255])
  assert.equal(quitarFondo(d, W, H), 'quitado')
  assert.equal(px(d, W, W - 1, H - 1)[3], 0)
  assert.equal(px(d, W, 1, 1)[3], 255, 'el dibujo de la esquina queda')
})

caso('PNG que ya viene con fondo transparente → no se toca', () => {
  const d = imagen(W, H, [0, 0, 0, 0], (x, y) => (cuadrado(x, y) ? [...AMARILLO, 255] : null))
  const antes = Array.from(d)
  assert.equal(quitarFondo(d, W, H), 'transparente')
  assert.deepEqual(Array.from(d), antes)
})

caso('imagen lisa de un solo color → queda toda transparente, sin romper', () => {
  const d = imagen(8, 8, [10, 10, 10])
  assert.equal(quitarFondo(d, 8, 8), 'quitado')
  assert.ok(Array.from(d).every((v, i) => i % 4 !== 3 || v === 0))
})

caso('medidas inválidas o array corto → no rompe ni toca', () => {
  assert.equal(quitarFondo(new Uint8ClampedArray(0), 0, 0), 'sin-fondo-liso')
  assert.equal(quitarFondo(new Uint8ClampedArray(8), 4, 4), 'sin-fondo-liso')
  const uno = new Uint8ClampedArray([5, 5, 5, 255])
  assert.equal(quitarFondo(uno, 1, 1), 'quitado')
})

console.log(`check-quitar-fondo: ${ok} casos OK`)
