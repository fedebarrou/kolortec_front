/**
 * Marcas de texto del blog: *negrita* y _cursiva_.
 *
 * contentService.parseBlogContent deja las marcas tal cual vienen en el texto (antes las BORRABA y la
 * negrita nunca se veía); GuideDetailPage las dibuja con <strong>/<em> a partir de estos tokens.
 * Son elementos de React, NUNCA `dangerouslySetInnerHTML`: lo que no es marca (incluido cualquier
 * `<b>`, `<img onerror=…>` o `<script>` que alguien escriba en una nota) queda como TEXTO.
 *
 * Reglas, para no italizar por accidente:
 *  - `**doble**` es la misma negrita (sin asteriscos sueltos alrededor);
 *  - `***triple***` es negrita + cursiva (un <strong> con un <em> adentro), también sin asteriscos sueltos;
 *  - la marca abre pegada a una letra/número/signo (no a un espacio) y cierra igual: `2 * 3 * 4` no es negrita;
 *  - `_` sólo cuenta en el borde de una palabra: `cable_dmx_1` o una URL con guiones bajos NO se pone en cursiva;
 *  - la negrita puede llevar cursiva adentro (`*uno _dos_ tres*`) y la cursiva una negrita (`_uno **dos** tres_`); lo demás no se anida;
 *  - una marca sin cierre se deja como texto (un `*` suelto se ve como `*`).
 */

// ***negrita cursiva***, **negrita** o *negrita*: abre y cierra pegada al texto. Adentro no hay otro `*`. Las formas
// más largas se prueban primero: con la simple sola, `**x**` marcaba «x» y dejaba un `*` suelto a cada lado, y con la
// doble sola `***x***` hacía lo mismo.
const NEGRITA = /\*\*\*([^*\s](?:[^*]*[^*\s])?)\*\*\*|\*\*([^*\s](?:[^*]*[^*\s])?)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*/
// _cursiva_: el `_` de apertura no puede venir pegado a una letra/número/`_` (borde de palabra), ni el de cierre ir seguido de uno.
const CURSIVA = /(?<![\p{L}\p{N}_])_([^_\s](?:[^_]*[^_\s])?)_(?![\p{L}\p{N}_])/u

/**
 * Texto → tokens `{ type: 'text' | 'strong' | 'em', text }` (la negrita con cursiva adentro trae `children`).
 * Nunca devuelve HTML: el que lo dibuja decide cómo, y React escapa el texto.
 */
export function parseInline(input) {
  const out = []
  analizar(String(input ?? ''), out)
  return out
}

// Las mismas expresiones en dos variantes: global (la PRÓXIMA marca, desde el principio del resto) y pegajosa (¿abre justo acá?).
const NEGRITA_G = new RegExp(NEGRITA.source, 'g')
const NEGRITA_Y = new RegExp(NEGRITA.source, 'y')
const CURSIVA_G = new RegExp(CURSIVA.source, 'gu')
const CURSIVA_Y = new RegExp(CURSIVA.source, 'yu')

/**
 * La próxima marca de `resto` (que empieza en `pos` del texto entero): `{ abs, m }` con `abs` = dónde abre, o `{ abs: Infinity }` si
 * no hay ninguna. Lo ya encontrado MÁS ADELANTE se reutiliza (`cache`) mientras no lo hayamos pasado: sin eso cada vuelta volvía a
 * recorrer todo el resto buscando la otra marca y un texto largo con miles de marcas era cuadrático (SEC-002).
 */
function proxima(reG, reY, cache, resto, pos) {
  // ¿Abre justo acá? Con el contexto del resto (el lookbehind de la cursiva ve el principio del tramo, como antes de reutilizar nada).
  reY.lastIndex = 0
  const aqui = reY.exec(resto)
  if (aqui) return { abs: pos, m: aqui }
  if (cache && cache.abs > pos) return cache // vale: ninguna marca arranca entre `pos` y `cache.abs` (o no hay más: Infinity)
  reG.lastIndex = 0
  const m = reG.exec(resto)
  return m ? { abs: pos + m.index, m } : { abs: Infinity, m: null }
}

/**
 * Parte `texto` en tokens y los agrega a `out`. En cada vuelta toma la marca que ABRE primero (negrita o cursiva) y
 * analiza su interior con las mismas reglas: así la cursiva puede abarcar una negrita (`_uno **dos** tres_`) y la
 * negrita una cursiva (`*uno _dos_ tres*`) sin que ninguna se pierda ni deje sus `*` / `_` a la vista.
 */
function analizar(texto, out) {
  let pos = 0
  let cacheNeg = null
  let cacheCur = null
  while (pos < texto.length) {
    const resto = texto.slice(pos)
    cacheNeg = proxima(NEGRITA_G, NEGRITA_Y, cacheNeg, resto, pos)
    cacheCur = proxima(CURSIVA_G, CURSIVA_Y, cacheCur, resto, pos)
    if (!cacheNeg.m && !cacheCur.m) {
      out.push({ type: 'text', text: resto })
      return
    }
    const esNegrita = cacheNeg.m && cacheNeg.abs <= cacheCur.abs
    const { abs, m } = esNegrita ? cacheNeg : cacheCur
    if (abs > pos) out.push({ type: 'text', text: texto.slice(pos, abs) })
    if (esNegrita && m[1] !== undefined) {
      // ***x***: negrita Y cursiva.
      out.push({ type: 'strong', text: m[1], children: [{ type: 'em', text: m[1] }] })
    } else {
      const dentro = esNegrita ? (m[2] ?? m[3]) : m[1]
      const hijos = interior(dentro)
      out.push(hijos ? { type: esNegrita ? 'strong' : 'em', text: dentro, children: hijos } : { type: esNegrita ? 'strong' : 'em', text: dentro })
    }
    pos = abs + m[0].length
  }
}

/** Los tokens de adentro de una marca, o `undefined` si adentro no hay otra marca (queda el texto plano). */
function interior(texto) {
  const hijos = []
  analizar(texto, hijos)
  return hijos.some((h) => h.type !== 'text') ? hijos : undefined
}

/**
 * El mismo texto SIN marcas (para los títulos, que ya van en negrita por estilo): aplica exactamente las reglas de
 * `parseInline`, así que `*x*`, `**x**`, `***x***` y `_x_` pierden sus marcas, y `2 * 3 * 4` o `cable_dmx_1` quedan intactos.
 */
export function textoSinMarcas(input) {
  const aplanar = (tokens) => tokens.map((t) => (t.children ? aplanar(t.children) : t.text)).join('')
  return aplanar(parseInline(input))
}
