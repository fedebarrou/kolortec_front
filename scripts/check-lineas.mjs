/**
 * check-lineas — el contrato del slug de una línea de producto.
 *
 * Por qué existe: una línea NO es una entidad con slug propio, es un campo de
 * texto libre del producto. La URL /linea/:slug se deriva del nombre, y los
 * accesos del hero y del scrolltelling guardan ese link como texto. Si
 * slugifyLinea cambia de criterio, los links que ya están cargados dejan de
 * resolver y NADIE se entera: la página simplemente dice "no encontrada".
 *
 *   node scripts/check-lineas.mjs
 */
import { slugifyLinea } from '../src/shared/services/contentService.js'

let fallas = 0
const check = (ok, msg) => { if (!ok) { console.error('  ✗ ' + msg); fallas++ } }

// 1. slug: lo que el admin escribe → lo que va en la URL
const casos = [
  ['Golden Line', 'golden-line'],
  ['Beam', 'beam'],
  ['Línea Pro', 'linea-pro'],
  ['  Wash  IP65 ', 'wash-ip65'],
  ['Pro Stage / Touring', 'pro-stage-touring'],
  ['MEGAKOLOR', 'megakolor'],
  ['Serie 3000W', 'serie-3000w'],
]
for (const [entrada, esperado] of casos) {
  const salida = slugifyLinea(entrada)
  check(salida === esperado, `slugifyLinea(${JSON.stringify(entrada)}) → ${JSON.stringify(salida)}, esperaba ${JSON.stringify(esperado)}`)
}

// 2. estabilidad: slugificar dos veces da lo mismo (el link del hero no se rompe
//    si alguien pega la URL ya slugificada)
for (const [entrada] of casos) {
  const a = slugifyLinea(entrada)
  check(slugifyLinea(a) === a, `no es idempotente para ${JSON.stringify(entrada)}`)
}

// 3. el filtro EXACTO que hace la página, contra productos con y sin línea
const productos = [
  { name: 'BEAM 5R', line: 'Golden Line' },
  { name: 'WASH 200', line: 'Wash' },
  { name: 'STARPAR', line: 'Golden Line' },
  { name: 'SIN LINEA', line: undefined },
  { name: 'VACIA', line: '' },
  { name: 'ACENTO', line: 'Línea Pro' },
]
const filtrar = (slug) => productos.filter((p) => p.line && slugifyLinea(p.line) === slug)

check(filtrar('golden-line').length === 2, `golden-line deberia traer 2, trajo ${filtrar('golden-line').length}`)
check(filtrar('wash').length === 1, 'wash deberia traer 1')
check(filtrar('linea-pro').length === 1, 'linea-pro (con acento en el origen) deberia traer 1')
check(filtrar('no-existe').length === 0, 'una linea inexistente no puede traer nada')
// los que no tienen linea NUNCA entran, ni con slug vacio
check(filtrar('').length === 0, 'slug vacio no puede matchear a los productos sin linea')

// 4. agrupado: lo que hace getLines() para armar los chips de "otras lineas"
const porSlug = new Map()
for (const p of productos) {
  const n = (p.line ?? '').trim()
  if (!n) continue
  const s = slugifyLinea(n)
  if (!s) continue
  const a = porSlug.get(s)
  if (a) a.count += 1
  else porSlug.set(s, { name: n, slug: s, count: 1 })
}
check(porSlug.size === 3, `deberia agrupar en 3 lineas, agrupo ${porSlug.size}`)
check(porSlug.get('golden-line')?.count === 2, 'golden-line deberia contar 2')

if (fallas) { console.error(`\n${fallas} falla(s)`); process.exit(1) }
console.log(`OK — ${casos.length * 2 + 7} comprobaciones de la lógica de líneas`)
