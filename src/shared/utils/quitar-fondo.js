/**
 * quitar-fondo.js — vuelve TRANSPARENTE el fondo liso de una imagen (pedido de Fedev, 13-nov-2026: «a todas las
 * imágenes de las innovaciones quitarle el bg color»).
 *
 * Las imágenes de innovaciones las sube el cliente en tiendita con el fondo que tengan (negro, blanco, un gris).
 * Sobre la tarjeta del sitio ese fondo se ve como un parche. Acá no se toca ningún archivo: se trabaja sobre los
 * píxeles ya leídos en un canvas (InnovacionIcono) y se devuelve la misma imagen con el fondo en alfa 0.
 *
 * Función PURA sobre el array RGBA (sin DOM): la prueba scripts/check-quitar-fondo.mjs.
 *
 * Cuándo se quita y cuándo NO:
 *   · el fondo es el color que más se repite entre las 4 esquinas, y tienen que coincidir al menos 3;
 *   · además la mayor parte del BORDE de la imagen (≥ 75 %) tiene que ser de ese color. Una foto (esquinas y
 *     borde de colores distintos) no tiene «fondo liso»: se deja como está, en vez de agujerearla. No se pide
 *     más del 75 % porque los archivos reales llegan con el dibujo tocando los bordes en algún tramo.
 *   · si el fondo ya es transparente no hay nada que hacer.
 *   · fondo CLARO con dibujo OSCURO: no se quita. El sitio es oscuro; sin su fondo ese dibujo no se vería.
 *
 * Límite conocido: un color del dibujo PARECIDO al fondo (un pastel sobre blanco) queda semitransparente y sobre
 * la tarjeta oscura se ve más apagado que en el archivo. Para esos casos lo correcto es subir un PNG transparente.
 *
 * Cómo: «color a alfa». La opacidad de cada píxel sale de cuánto se aleja del fondo: hasta PISO es fondo (ruido
 * de JPG incluido) y es opaco recién a RANGO de distancia. Entre medio están los píxeles del borde del dibujo
 * —mezcla de dibujo y fondo por el suavizado—: quedan semitransparentes y además se les saca del color la parte
 * de fondo que traían. Sin eso, un ícono sobre blanco quedaba con un halo claro al apoyarlo sobre la tarjeta
 * oscura. RANGO es ancho a propósito: con uno angosto (72) un píxel mitad dibujo / mitad fondo ya contaba como
 * opaco y el halo quedaba entero. Sobre el fondo ORIGINAL el resultado se ve idéntico al archivo.
 */

const PISO = 14 // diferencia (0–255, canal que más difiere) por debajo de la cual un píxel ES fondo
const RANGO = 160 // a esta diferencia (o más) el píxel es dibujo puro, opaco
const BORDE_LISO = 0.75 // fracción del perímetro que tiene que ser fondo para considerarlo liso
const ESQUINAS_MIN = 3
const FONDO_CLARO = 150 // luminosidad (0–255) a partir de la cual el fondo cuenta como claro
const DIBUJO_OSCURO = 80 // luminosidad media del dibujo por debajo de la cual no se vería sobre la tarjeta oscura

const luz = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

const difiere = (d, k, f) => Math.max(Math.abs(d[k] - f[0]), Math.abs(d[k + 1] - f[1]), Math.abs(d[k + 2] - f[2]))

/** El color que más se repite entre las 4 esquinas y cuántas coinciden con él. */
export function fondoDeEsquinas(d, w, h) {
  const esquinas = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3]])
  const parecido = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) + Math.abs(p[3] - q[3]) < 40
  let color = esquinas[0]
  let votos = -1
  for (const e of esquinas) {
    const n = esquinas.filter((o) => parecido(e, o)).length
    if (n > votos) {
      votos = n
      color = e
    }
  }
  return { color, votos }
}

/**
 * Quita el fondo liso EN EL MISMO array.
 * @param {Uint8ClampedArray|number[]} d  píxeles RGBA
 * @returns {'quitado'|'transparente'|'sin-fondo-liso'|'dibujo-oscuro'} qué pasó: se quitó · ya era transparente ·
 *   no es un fondo liso · fondo claro con dibujo oscuro. Sólo con 'quitado' se tocó el array.
 */
export function quitarFondo(d, w, h) {
  if (!w || !h || d.length < w * h * 4) return 'sin-fondo-liso'
  const { color: f, votos } = fondoDeEsquinas(d, w, h)
  if (f[3] < 128) return 'transparente'
  if (votos < ESQUINAS_MIN) return 'sin-fondo-liso'

  // Perímetro: ¿es casi todo del color de fondo?
  let borde = 0
  let liso = 0
  const mirar = (x, y) => {
    const k = (y * w + x) * 4
    borde += 1
    if (d[k + 3] < 128 || difiere(d, k, f) <= PISO) liso += 1
  }
  for (let x = 0; x < w; x += 1) {
    mirar(x, 0)
    if (h > 1) mirar(x, h - 1)
  }
  for (let y = 1; y < h - 1; y += 1) {
    mirar(0, y)
    if (w > 1) mirar(w - 1, y)
  }
  if (liso / borde < BORDE_LISO) return 'sin-fondo-liso'

  // Fondo CLARO con dibujo OSCURO: sin el fondo, el dibujo quedaría oscuro sobre la tarjeta oscura del sitio y no
  // se vería (joan REG-002). En ese caso el fondo es lo que lo hace legible: no se quita.
  if (luz(f) > FONDO_CLARO) {
    let suma = 0
    let n = 0
    for (let k = 0; k < w * h * 4; k += 4) {
      if (d[k + 3] < 128 || difiere(d, k, f) < RANGO / 2) continue // sólo lo que claramente es dibujo
      suma += luz([d[k], d[k + 1], d[k + 2]])
      n += 1
    }
    if (n > 0 && suma / n < DIBUJO_OSCURO) return 'dibujo-oscuro'
  }

  for (let k = 0; k < w * h * 4; k += 4) {
    const dif = difiere(d, k, f)
    if (dif >= RANGO) continue
    if (dif <= PISO) {
      d[k + 3] = 0
      continue
    }
    const a = dif / RANGO
    // píxel = a·dibujo + (1−a)·fondo  →  dibujo = fondo + (píxel − fondo) / a
    for (let c = 0; c < 3; c += 1) d[k + c] = Math.min(255, Math.max(0, Math.round(f[c] + (d[k + c] - f[c]) / a)))
    d[k + 3] = Math.round(d[k + 3] * a)
  }
  return 'quitado'
}
