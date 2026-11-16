/**
 * Título SEO de la ficha de producto: «<Producto> · <Categoría> · Kolortec».
 *
 * Por qué: el título era «<Producto> · Kolortec». Un modelo («KT-350 Beam») no dice qué es, y nadie que todavía no
 * conoce la marca busca por modelo: busca «cabezal móvil». La categoría es la palabra que falta.
 *
 * La categoría se omite si no hay, o si el nombre del producto ya la trae («Cabezal móvil KT-350» en «Cabezales
 * móviles» no repite): se compara sin tildes, sin mayúsculas y sin la «s»/«es» del plural.
 */
const base = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// «strobes»/«strobe» → «strob», «moviles»/«movil» → «movil»: saca la «s» y después la «e», así no depende de adivinar
// si el plural era «-s» o «-es». Sólo sirve para comparar, nunca se muestra.
const singular = (palabra) => (palabra.length > 3 ? palabra.replace(/s$/, '').replace(/e$/, '') : palabra)

const CONECTORES = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'para', 'con', 'en'])

export function tituloSeoProducto(nombre, categoria) {
  const n = String(nombre || '').trim()
  const c = String(categoria || '').trim()
  if (!n) return 'Kolortec'
  if (!c) return `${n} · Kolortec`
  const enNombre = new Set(base(n).split(' ').map(singular))
  // Se ignoran los conectores («Barras DE led»), no las palabras cortas: «DJ» o «TV» son categorías válidas.
  const palabras = base(c).split(' ').filter((p) => p && !CONECTORES.has(p)).map(singular)
  // Una categoría que es sólo símbolos («—») no aporta nada al título.
  if (palabras.length === 0) return `${n} · Kolortec`
  const yaLaTrae = palabras.every((p) => enNombre.has(p))
  return yaLaTrae ? `${n} · Kolortec` : `${n} · ${c} · Kolortec`
}
