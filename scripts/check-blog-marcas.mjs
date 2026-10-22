/**
 * check-blog-marcas.mjs — las guías del blog (/soporte/guias/:slug) dibujan *negrita* y _cursiva_, y NO inyectan HTML.
 *
 * 21-oct. Bug: contentService.parseBlogContent BORRABA las marcas (`*x*` → `x`), así que la negrita de las guías no se
 * veía nunca. Ahora el cuerpo las conserva y GuideDetailPage las dibuja con <strong>/<em> (elementos de React, nunca
 * dangerouslySetInnerHTML).
 *
 * Qué prueba, con una guía FALSA servida por intercepción (no pega a ningún servidor):
 *   · puro (helpers/inlineMarks.js): negrita, cursiva, negrita con cursiva adentro, `2 * 3 * 4`, `cable_dmx_1`, marca sin cierre.
 *   · navegador: <strong> con peso ≥ 700 y <em> en cursiva, en párrafo, en viñeta y en aviso; sin asteriscos sueltos
 *     alrededor; los TÍTULOS no llevan marcas; `2 * 3 * 4`, `cable_dmx_1` y `*sin cierre` quedan como texto.
 *   · `**doble**` es la misma negrita, sin asteriscos sueltos (también en los títulos).
 *   · una línea SIN <tag> también dibuja sus marcas (contentService.parseBlogContent, rama sin etiqueta).
 *   · `valor_x_ listo` (un `_` pegado a una letra que abre y otro que cierra seguido de espacio) NO es cursiva: es lo
 *     único que exige el lookbehind de CURSIVA en inlineMarks.js; `cable_dmx_1` lo aguanta el lookahead solo.
 *   · el espacio después de una palabra en cursiva SE VE: Manrope no trae cursiva, el navegador inclina la normal y la
 *     inclinación se come el aire («pocoaceite»). Se mide en píxeles del screenshot, no en el código.
 *   · SIN INYECCIÓN: un `<b>`, un `<img onerror>` y un `<script>` escritos en la nota se ven como TEXTO — no hay
 *     <b>/<img>/<script> en el artículo y el onerror/script no corrió (window.__pwn sigue sin definir).
 *
 *   npm run dev            (en otra terminal)
 *   node scripts/check-blog-marcas.mjs
 *   KT_BASE=http://127.0.0.1:5391 node scripts/check-blog-marcas.mjs
 *
 * Cómo levantar el vite (REG-005): con el hostname de QA, NO con el .env de producción. La API pública se mockea por intercepción
 * y estas dos variables hacen que el front pida a un host que no existe, así que nada puede salir hacia producción:
 *   VITE_API_BASE_URL=http://api.qa.invalid/api VITE_TIENDITA_ACCOUNT_HOST=kolortec.qa.invalid \
 *     npx vite --host 127.0.0.1 --port <puerto> --strictPort
 */
import puppeteer from 'puppeteer'
import { parseInline, textoSinMarcas } from '../src/features/guides/helpers/inlineMarks.js'

const BASE = (process.env.KT_BASE || 'http://127.0.0.1:5173').replace(/\/$/, '')

const fallas = []
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK  ' : 'FALLA'} ${msg}`)
  if (!cond) fallas.push(msg)
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- puro ----------
const tipos = (t) => JSON.stringify(parseInline(t).map((x) => [x.type, x.text]))
ok(tipos('Apagá *siempre* el equipo') === JSON.stringify([['text', 'Apagá '], ['strong', 'siempre'], ['text', ' el equipo']]), 'puro: *negrita* → strong')
ok(tipos('usá _poco_ aceite') === JSON.stringify([['text', 'usá '], ['em', 'poco'], ['text', ' aceite']]), 'puro: _cursiva_ → em')
ok(parseInline('*uno _dos_ tres*')[0].children?.some((h) => h.type === 'em' && h.text === 'dos'), 'puro: negrita con cursiva adentro')
ok(tipos('2 * 3 * 4') === JSON.stringify([['text', '2 * 3 * 4']]), 'puro: «2 * 3 * 4» no es negrita')
ok(tipos('cable_dmx_1 listo') === JSON.stringify([['text', 'cable_dmx_1 listo']]), 'puro: «cable_dmx_1» no es cursiva')
ok(tipos('*sin cierre') === JSON.stringify([['text', '*sin cierre']]), 'puro: una marca sin cierre queda como texto')
ok(tipos('Esto es **doble** ok') === JSON.stringify([['text', 'Esto es '], ['strong', 'doble'], ['text', ' ok']]), 'puro: **doble** → strong, sin asteriscos sueltos')
// REG-004: ***triple*** = negrita + cursiva (un <strong> con un <em> adentro), sin asteriscos sueltos.
ok(JSON.stringify(parseInline('Mira ***triple*** ok')) === JSON.stringify([
  { type: 'text', text: 'Mira ' },
  { type: 'strong', text: 'triple', children: [{ type: 'em', text: 'triple' }] },
  { type: 'text', text: ' ok' },
]), 'puro: ***triple*** → strong con em adentro, sin asteriscos sueltos')
ok(tipos('a *** b') === JSON.stringify([['text', 'a *** b']]), 'puro: «a *** b» (asteriscos sueltos) queda como texto')
ok(tipos('valor_x_ listo') === JSON.stringify([['text', 'valor_x_ listo']]), 'puro: «valor_x_ listo» no es cursiva (lo exige el lookbehind)')
ok(tipos('palabra_con_guion_bajo y más') === JSON.stringify([['text', 'palabra_con_guion_bajo y más']]), 'puro: «palabra_con_guion_bajo» no es cursiva')
ok(parseInline('<b>x</b>').every((x) => x.type === 'text'), 'puro: el HTML nunca es un token de formato (sólo texto)')
// REG-001 (5.ª vuelta): la cursiva puede abarcar una negrita y al revés; ninguna se pierde ni deja sus marcas a la vista.
const cn = parseInline('_cursiva **negrita** adentro_')
ok(cn.length === 1 && cn[0].type === 'em' && cn[0].children?.some((h) => h.type === 'strong' && h.text === 'negrita'), 'puro: «_cursiva **negrita** adentro_» → em con strong adentro')
ok(textoSinMarcas('_cursiva **negrita** adentro_') === 'cursiva negrita adentro', 'puro: textoSinMarcas(«_cursiva **negrita** adentro_») no deja ni _ ni *')
const nc = parseInline('**negrita _cursiva_ adentro**')
ok(nc.length === 1 && nc[0].type === 'strong' && nc[0].children?.some((h) => h.type === 'em' && h.text === 'cursiva'), 'puro: «**negrita _cursiva_ adentro**» → strong con em adentro')
ok(textoSinMarcas('**negrita _cursiva_ adentro**') === 'negrita cursiva adentro', 'puro: textoSinMarcas(«**negrita _cursiva_ adentro**») no deja marcas')
ok(textoSinMarcas('_a_ y *b* y cable_dmx_1 y 2 * 3 * 4') === 'a y b y cable_dmx_1 y 2 * 3 * 4', 'puro: textoSinMarcas sigue respetando «cable_dmx_1» y «2 * 3 * 4»')

// ---------- navegador ----------
const CONTENIDO = [
  '<h2>Antes de *empezar* con _calma_',
  '<p>Apagá *siempre* el equipo y usá _poco_ aceite.',
  '<li>Paso *uno* del _mantenimiento_',
  '<li>Segundo paso sin marcas',
  '<warn>Nunca abras con *tensión* conectada',
  '<p>*<img src=x onerror="window.__pwn=1">* y <b>negrita falsa</b> <script>window.__pwn=2</script>',
  '<p>cable_dmx_1 y 2 * 3 * 4 y *sin cierre',
  '<p>Revisá el _nivel_ de aceite y la marca **doble** del tanque',
  'Línea sin etiqueta con *negrita* suelta',
  '<p>La variable valor_x_ listo y palabra_con_guion_bajo siguen siendo texto',
  '<h2>Parte **tres**',
  '<h2>Segunda parte',
  '<p>Texto {entre llaves} con *negrita final*',
  // REG-004 / REG-005
  '<h2>Título ***triple*** con cable_dmx_1 y 2 * 3 * 4',
  '<p>Marca ***triple*** en el párrafo y ***otra*** más',
  // REG-001 (5.ª vuelta)
  '<p>Anidadas: _cursiva **negrita** adentro_ y **negrita _cursiva_ adentro** fin',
].join('\n')
const POST = {
  id: 'g1',
  slug: 'guia-de-prueba',
  titulo: 'Guía de prueba',
  excerpt: 'Una guía para probar las marcas.',
  contenido: CONTENIDO,
  published_at: '2026-10-21',
  media: [],
}

// Aire mínimo (px de columnas sin tinta) entre una palabra en cursiva y la siguiente, medido en el screenshot.
const AIRE_MIN = 3

const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
const prodLeak = []

const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = req.url()
    if (/^https:\/\/translate\.soytiendita\.store\//.test(url)) {
      const h = { 'Access-Control-Allow-Origin': req.headers().origin || '*' }
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { ...h, 'Access-Control-Allow-Headers': 'Content-Type' } })
      return req.respond({ status: 503, headers: h, contentType: 'application/json', body: '{}' })
    }
    if (!/\/api\/public\//.test(url) && HOST_PROD.test(url)) {
      prodLeak.push(url)
      return req.abort()
    }
    if (!/\/api\/public\//.test(url)) return req.continue()
    const headers = {
      'Access-Control-Allow-Origin': req.headers().origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, X-Account-Host, Accept, Authorization',
    }
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers })
    const { pathname } = new URL(url)
    let body = null
    if (pathname.endsWith('/public/blog')) body = [POST]
    if (/\/public\/(categorias|productos)$/.test(pathname)) body = []
    if (body === null) return req.respond({ status: 404, headers, contentType: 'application/json', body: '{}' })
    return req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) })
  })

  await page.goto(`${BASE}/soporte/guias/guia-de-prueba`, { waitUntil: 'networkidle2' })
  // Si la página no dibuja la guía, esa es la falla (con nombre), no un TimeoutError que mata el script sin dictamen.
  const cargo = await page.waitForSelector('article h1', { timeout: 15000 }).then(() => true, () => false)
  ok(cargo, 'la guía de prueba carga (hay un <article> con su título)')
  // Un onerror/script inyectado corre en milisegundos: se le da lugar a dispararse y se mira el resultado, no el reloj.
  const disparo = await page.waitForFunction(() => window.__pwn !== undefined, { timeout: 1500 }).then(() => true, () => false)
  ok(!disparo, 'SIN inyección: ningún onerror/script de la nota se ejecutó en 1,5 s')
  if (cargo) {

  const info = await page.evaluate(() => {
    const art = document.querySelector('article')
    const q = (sel) => [...art.querySelectorAll(sel)]
    const estilo = (el) => { const cs = getComputedStyle(el); return { peso: Number(cs.fontWeight), cursiva: cs.fontStyle } }
    const strongs = q('strong').map((el) => ({ t: el.textContent, ...estilo(el), en: el.closest('li') ? 'li' : el.closest('p.flex') ? 'warn' : el.closest('p') ? 'p' : '?' }))
    const ems = q('em').map((el) => ({ t: el.textContent, ...estilo(el), en: el.closest('li') ? 'li' : el.closest('p') ? 'p' : '?' }))
    return {
      strongs,
      ems,
      h2: q('h2').map((h) => h.textContent.trim()),
      // negrita + cursiva: un <em> DENTRO de un <strong>.
      emStrong: q('em strong').map((el) => ({ t: el.textContent, peso: Number(getComputedStyle(el).fontWeight), cursiva: getComputedStyle(el).fontStyle })),
      strongEm: q('strong em').map((el) => ({ t: el.textContent, peso: Number(getComputedStyle(el).fontWeight), cursiva: getComputedStyle(el).fontStyle })),
      texto: art.innerText,
      b: q('b').length,
      img: q('img[src="x"]').length,
      // El JSON-LD de la nota (Seo) es un <script type="application/ld+json"> legítimo: no cuenta.
      script: q('script:not([type="application/ld+json"])').length,
      pwn: window.__pwn,
    }
  })

  const s = (t) => info.strongs.find((x) => x.t === t)
  const e = (t) => info.ems.find((x) => x.t === t)
  ok(s('siempre') && s('siempre').peso >= 700 && s('siempre').en === 'p', `párrafo: «siempre» es <strong> con peso ${s('siempre')?.peso}`)
  ok(e('poco') && e('poco').cursiva === 'italic' && e('poco').en === 'p', `párrafo: «poco» es <em> en cursiva (${e('poco')?.cursiva})`)
  ok(s('uno') && s('uno').peso >= 700 && s('uno').en === 'li', 'viñeta: «uno» es <strong>')
  ok(e('mantenimiento') && e('mantenimiento').cursiva === 'italic' && e('mantenimiento').en === 'li', 'viñeta: «mantenimiento» es <em>')
  ok(s('tensión') && s('tensión').peso >= 700 && s('tensión').en === 'warn', 'aviso: «tensión» es <strong>')
  ok(s('negrita final') && s('negrita final').peso >= 700, 'párrafo con {llaves}: «negrita final» es <strong>')
  ok(info.texto.includes('Texto entre llaves con negrita final'), 'las {llaves} se siguen quitando y queda el texto')
  ok(!/\*siempre\*|\*uno\*|_poco_|_mantenimiento_|\*tensión\*/.test(info.texto), 'no quedan asteriscos ni guiones bajos alrededor de las marcas')
  ok(info.h2[0] === 'Antes de empezar con calma', `el título no lleva marcas (${info.h2[0]})`)
  ok(info.texto.includes('2 * 3 * 4') && info.texto.includes('cable_dmx_1') && info.texto.includes('*sin cierre'), '«2 * 3 * 4», «cable_dmx_1» y «*sin cierre» quedan como texto')
  ok(!info.ems.some((x) => x.t === 'dmx'), '«cable_dmx_1» no genera una cursiva')

  ok(info.b === 0 && info.img === 0 && info.script === 0, `SIN inyección: ningún <b>, <img src=x> ni <script> en el artículo (${info.b}/${info.img}/${info.script})`)
  ok(info.pwn === undefined, `SIN inyección: onerror/script no corrieron (window.__pwn = ${info.pwn})`)
  ok(info.texto.includes('<b>negrita falsa</b>') && info.texto.includes('<script>window.__pwn=2</script>'), 'el HTML escrito en la nota se ve como texto literal')
  ok(s('<img src=x onerror="window.__pwn=1">') !== undefined, 'una negrita con HTML adentro muestra el HTML como texto, en negrita')

  // REG-003: **doble** = negrita, sin asteriscos sueltos (cuerpo y título).
  ok(s('doble') && s('doble').peso >= 700 && s('doble').en === 'p', '«**doble**» es <strong> en el párrafo')
  ok(info.texto.includes('la marca doble del tanque') && !/\*doble|doble\*/.test(info.texto), '«**doble**» no deja asteriscos sueltos en el texto')
  ok(info.h2.includes('Parte tres'), `el título «Parte **tres**» no lleva asteriscos (${info.h2.join(" | ")})`)
  // REG-004: ***triple*** = negrita + cursiva, sin asteriscos sueltos. REG-005: el título aplica las MISMAS reglas que el cuerpo.
  const triple = info.strongEm.find((x) => x.t === 'triple')
  ok(triple && triple.peso >= 700 && triple.cursiva === 'italic', `«***triple***» es <strong><em> (peso ${triple?.peso}, ${triple?.cursiva})`)
  ok(info.strongEm.some((x) => x.t === 'otra'), '«***otra***» (una segunda en el mismo párrafo) también')
  ok(info.texto.includes('Marca triple en el párrafo y otra más') && !/\*triple|triple\*|\*otra|otra\*/.test(info.texto), '«***x***» no deja asteriscos sueltos en el texto')
  // REG-001 (5.ª vuelta): cursiva que abarca una negrita (y al revés) en el cuerpo real, sin _ ni * a la vista.
  ok(info.texto.includes('Anidadas: cursiva negrita adentro y negrita cursiva adentro fin'), 'REG-001: las marcas anidadas no dejan _ ni * a la vista')
  ok(info.emStrong.some((x) => x.t === 'negrita' && x.peso >= 700 && x.cursiva === 'italic'), 'REG-001: «_cursiva **negrita** adentro_» pone la negrita DENTRO de la cursiva (<em><strong>)')
  ok(info.strongEm.some((x) => x.t === 'cursiva' && x.cursiva === 'italic'), 'REG-001: «**negrita _cursiva_ adentro**» pone la cursiva dentro de la negrita (<strong><em>)')
  ok(info.h2.includes('Título triple con cable_dmx_1 y 2 * 3 * 4'), `título: «***triple***» pierde las marcas, «cable_dmx_1» y «2 * 3 * 4» quedan igual (${info.h2.join(' | ')})`)
  // REG-002: línea sin <tag> con *negrita* (contentService.parseBlogContent, rama sin etiqueta).
  ok(s('negrita') && s('negrita').peso >= 700 && s('negrita').en === 'p', 'línea SIN <tag>: «negrita» es <strong>')
  ok(info.texto.includes('Línea sin etiqueta con negrita suelta'), 'línea SIN <tag>: el texto queda sin asteriscos')
  // REG-002: el lookbehind de la cursiva.
  ok(info.texto.includes('valor_x_ listo') && info.texto.includes('palabra_con_guion_bajo'), '«valor_x_ listo» y «palabra_con_guion_bajo» quedan como texto')
  ok(!info.ems.some((x) => ['x', 'con', 'guion'].includes(x.t)), 'ni «valor_x_» ni «palabra_con_guion_bajo» generan una cursiva')

  // VIS-003: el aire después de una cursiva se VE. Se recorta «nivel de» del screenshot y se cuentan las columnas vacías
  // entre la última letra inclinada de «nivel» y la «d» siguiente.
  const caja = await page.evaluate(() => {
    const em = [...document.querySelectorAll('article em')].find((el) => el.textContent === 'nivel')
    em.scrollIntoView({ block: 'center' })
    const nodo = em.nextSibling
    const rg = document.createRange()
    rg.setStart(nodo, 1)
    rg.setEnd(nodo, 3)
    const a = em.getBoundingClientRect()
    const b = rg.getBoundingClientRect()
    const cs = getComputedStyle(em)
    return {
      x: a.left + scrollX - 12, y: a.top + scrollY - 2, w: b.right - a.left + 24, h: a.height + 4,
      emDer: a.right - a.left + 12, sigIzq: b.left - a.left + 12,
      margen: parseFloat(cs.marginRight), fs: parseFloat(cs.fontSize),
    }
  })
  const png = await page.screenshot({ clip: { x: caja.x, y: caja.y, width: caja.w, height: caja.h }, encoding: 'base64' })
  const lienzo = await browser.newPage()
  const tinta = await lienzo.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    const cols = []
    for (let x = 0; x < c.width; x++) {
      let hay = false
      for (let y = 0; y < c.height && !hay; y++) {
        const i = (y * c.width + x) * 4
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 90) hay = true
      }
      cols.push(hay)
    }
    return cols
  }, png)
  await lienzo.close()
  // La corrida vacía más larga entre el borde derecho de la caja de «nivel» (menos lo que se inclina) y el inicio de «de».
  let mejor = 0
  let corrida = 0
  for (let x = Math.max(0, Math.floor(caja.emDer) - 6); x <= Math.min(tinta.length - 1, Math.ceil(caja.sigIzq) + 3); x++) {
    corrida = tinta[x] ? 0 : corrida + 1
    mejor = Math.max(mejor, corrida)
  }
  console.log(`      (cursiva «nivel»: margen-derecho ${caja.margen}px de ${caja.fs}px; aire visible ${mejor}px)`)
  ok(caja.margen >= caja.fs * 0.08 - 0.05, `la cursiva lleva margen derecho >= 0,08em (${caja.margen}px de ${caja.fs}px)`)
  ok(mejor >= AIRE_MIN, `el espacio después de una cursiva se ve: ${mejor}px vacíos entre «nivel» y «de» (>= ${AIRE_MIN})`)
  }
  await page.close()
} finally {
  await browser.close()
}

console.log(`\nPROD_LEAK ${prodLeak.length}${prodLeak.length ? ` → ${[...new Set(prodLeak)].join(', ')}` : ''}`)
if (prodLeak.length) fallas.push(`PROD_LEAK ${prodLeak.length}: salieron pedidos hacia producción`)

if (fallas.length) {
  console.error(`\n${fallas.length} falla(s).`)
  process.exit(1)
}
console.log('\nTodo OK.')
