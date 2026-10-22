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

/**
 * Parte `texto` en tokens y los agrega a `out`. En cada vuelta toma la marca que ABRE primero (negrita o cursiva) y
 * analiza su interior con las mismas reglas: así la cursiva puede abarcar una negrita (`_uno **dos** tres_`) y la
 * negrita una cursiva (`*uno _dos_ tres*`) sin que ninguna se pierda ni deje sus `*` / `_` a la vista.
 */
function analizar(texto, out) {
  let resto = texto
  while (resto) {
    const neg = NEGRITA.exec(resto)
    const cur = CURSIVA.exec(resto)
    if (!neg && !cur) {
      out.push({ type: 'text', text: resto })
      return
    }
    const esNegrita = neg && (!cur || neg.index <= cur.index)
    const m = esNegrita ? neg : cur
    if (m.index > 0) out.push({ type: 'text', text: resto.slice(0, m.index) })
    if (esNegrita && m[1] !== undefined) {
      // ***x***: negrita Y cursiva.
      out.push({ type: 'strong', text: m[1], children: [{ type: 'em', text: m[1] }] })
    } else {
      const dentro = esNegrita ? (m[2] ?? m[3]) : m[1]
      const hijos = interior(dentro)
      out.push(hijos ? { type: esNegrita ? 'strong' : 'em', text: dentro, children: hijos } : { type: esNegrita ? 'strong' : 'em', text: dentro })
    }
    resto = resto.slice(m.index + m[0].length)
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
