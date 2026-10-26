/**
 * check-media.mjs — «En obra» (media asociada al producto): lógica, tokens y recorrido real.
 *
 * Tres capas, de la más barata a la más cara:
 *
 *  1) UNIDAD  — src/features/product/helpers/mediaHelpers.js (contarYFiltrar, mostrarVerLos, hayMedia,
 *               formatearDuracion, videoFrameSrc). Funciones puras: 4+3, sólo fotos sin chips, [], ítems sin url,
 *               6 contra 7 para «Ver los», NaN / 0 / 75 → 1:15.
 *  2) FUENTES — lo que no se puede probar sin un navegador pero sí leer: el token de borde de control
 *               (--line-control ≥ 3:1 sobre --bg, VIS-003), que la miniatura actual NO usa el mismo outline que el foco
 *               (VIS-004), y que ProductMedia / ProductDetailPage usan los helpers y el hook (nada de lógica duplicada ni
 *               deps a mano en el reveal, VIS-001).
 *  3) MUTACIONES — cada caso de 1) y 2) tiene que ponerse ROJO si se rompe la fuente. Se mutan COPIAS (os.tmpdir),
 *               nunca el archivo real: un check que nunca vio rojo no prueba nada.
 *  4) E2E     — con puppeteer contra un `vite` levantado (KT_BASE, por defecto http://127.0.0.1:5173) y la API
 *               PÚBLICA interceptada con mock-api/public-fixtures.mjs. NADA pega a producción: cualquier pedido a
 *               soytiendita.store / tiendita.com.ar que no sea la API interceptada se ABORTA y se cuenta como
 *               PROD_LEAK; con PROD_LEAK > 0 el check falla.
 *
 *   node scripts/check-media.mjs                         (todo; el E2E necesita el vite)
 *   KT_BASE=http://127.0.0.1:5288 node scripts/check-media.mjs
 *   Cómo levantar el vite (el mismo de los demás checks, REG-005): con el hostname de QA, NO con el .env de producción:
 *     VITE_API_BASE_URL=http://api.qa.invalid/api VITE_TIENDITA_ACCOUNT_HOST=kolortec.qa.invalid npx vite --host 127.0.0.1 --port 5288 --strictPort
 *   node scripts/check-media.mjs --sin-e2e               (sólo 1-3; no toca la red)
 */
import assert from 'node:assert/strict'
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as real from '../src/features/product/helpers/mediaHelpers.js'
import { handlePublic } from '../mock-api/public-fixtures.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '..')
const RUTAS = {
  helpers: resolve(raiz, 'src/features/product/helpers/mediaHelpers.js'),
  css: resolve(raiz, 'src/index.css'),
  media: resolve(raiz, 'src/features/product/components/ProductMedia.jsx'),
  pagina: resolve(raiz, 'src/features/product/pages/ProductDetailPage.jsx'),
}
const leer = (r) => readFileSync(r, 'utf8').replace(/\r\n/g, '\n')
const SIN_E2E = process.argv.includes('--sin-e2e')

// ───────────────────────────── helpers de contraste ─────────────────────────────
const canal = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminancia = (hex) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const token = (css, nombre) => {
  const m = new RegExp(`${nombre}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(css)
  return m ? m[1] : null
}
const bloque = (css, selector) => {
  const i = css.indexOf(`${selector} {`)
  if (i < 0) return null
  return css.slice(i, css.indexOf('}', i) + 1)
}

// ───────────────────────────── 1 + 2 · los casos ─────────────────────────────
const foto = (id, extra = {}) => ({ id, type: 'image', url: `http://x/${id}.jpg`, ...extra })
const video = (id, extra = {}) => ({ id, type: 'video', url: `http://x/${id}.mp4`, ...extra })
const CUATRO_Y_TRES = [foto(1), foto(2), foto(3), foto(4), video(5), video(6), video(7)]

/** @returns {Array<[string, () => void]>} Recibe las fuentes (reales o mutadas) y devuelve los casos. */
function casos({ h, css, mediaJsx, pagina }) {
  return [
    ['4 fotos + 3 videos: cuenta, chips y filtro', () => {
      const todo = h.contarYFiltrar(CUATRO_Y_TRES, 'all')
      assert.deepEqual({ ...todo, visibles: todo.visibles.length }, { fotos: 4, videos: 3, total: 7, hayDeAmbos: true, activo: 'all', visibles: 7 })
      const f = h.contarYFiltrar(CUATRO_Y_TRES, 'image')
      assert.equal(f.visibles.length, 4)
      assert.ok(f.visibles.every((m) => m.type === 'image'))
      const v = h.contarYFiltrar(CUATRO_Y_TRES, 'video')
      assert.equal(v.visibles.length, 3)
      assert.ok(v.visibles.every((m) => m.type === 'video'))
    }],
    ['sólo fotos: sin chips, y un filtro «video» heredado no deja la grilla vacía', () => {
      const r = h.contarYFiltrar([foto(1), foto(2), foto(3)], 'video')
      assert.equal(r.hayDeAmbos, false)
      assert.equal(r.activo, 'all')
      assert.equal(r.visibles.length, 3)
      assert.deepEqual([r.fotos, r.videos, r.total], [3, 0, 3])
      const s = h.contarYFiltrar([video(1)], 'image')
      assert.equal(s.hayDeAmbos, false)
      assert.equal(s.visibles.length, 1)
    }],
    ['[] / null / undefined / no-array: sin media → null (nada se dibuja)', () => {
      for (const v of [[], null, undefined, 'x', {}, 0]) {
        assert.equal(h.hayMedia(v), false, `hayMedia(${JSON.stringify(v)})`)
        const r = h.contarYFiltrar(v, 'all')
        assert.deepEqual({ ...r, visibles: r.visibles.length }, { fotos: 0, videos: 0, total: 0, hayDeAmbos: false, activo: 'all', visibles: 0 })
      }
      assert.equal(h.hayMedia([foto(1)]), true)
    }],
    ['ítems sin url (o null) se descartan; si no queda ninguno, no hay media', () => {
      const sucios = [null, { id: 1, type: 'image' }, { id: 2, type: 'video', url: '' }, undefined, foto(3)]
      const r = h.contarYFiltrar(sucios, 'all')
      assert.equal(r.total, 1)
      assert.equal(r.fotos, 1)
      assert.equal(r.videos, 0)
      assert.equal(h.hayMedia([{ id: 1, type: 'image' }, null]), false)
    }],
    ['un ítem de otro tipo cuenta en «Todo» pero no en Fotos ni en Videos', () => {
      const r = h.contarYFiltrar([foto(1), video(2), { id: 3, type: 'pdf', url: 'http://x/a.pdf' }], 'all')
      assert.deepEqual([r.fotos, r.videos, r.total, r.visibles.length], [1, 1, 3, 3])
    }],
    ['«Ver los N»: 6 no, 7 sí (y basura no)', () => {
      assert.equal(h.mostrarVerLos(6), false)
      assert.equal(h.mostrarVerLos(7), true)
      assert.equal(h.mostrarVerLos(12), true)
      for (const v of [0, 1, NaN, undefined, null, -1]) assert.equal(h.mostrarVerLos(v), false, `mostrarVerLos(${v})`)
      assert.equal(h.LIMITE_CELULAR, 6)
    }],
    ['formatearDuracion: NaN y 0 → vacío; 75 → 1:15; 65 → 1:05', () => {
      assert.equal(h.formatearDuracion(NaN), '')
      assert.equal(h.formatearDuracion(0), '')
      assert.equal(h.formatearDuracion(75), '1:15')
      assert.equal(h.formatearDuracion(65), '1:05')
      assert.equal(h.formatearDuracion(5), '0:05')
      for (const v of [undefined, null, Infinity, -4, '12']) assert.equal(h.formatearDuracion(v), '', `formatearDuracion(${v})`)
    }],
    ['videoFrameSrc: agrega #t=0.1 una sola vez', () => {
      assert.equal(h.videoFrameSrc('http://x/a.mp4'), 'http://x/a.mp4#t=0.1')
      assert.equal(h.videoFrameSrc('http://x/a.mp4#t=5'), 'http://x/a.mp4#t=5')
    }],
    ['VIS-003: --line-control existe y da ≥ 3:1 sobre --bg (el chip inactivo se ve)', () => {
      const lc = token(css, '--line-control')
      const bg = token(css, '--bg')
      assert.ok(lc && bg, `faltan tokens: --line-control=${lc} --bg=${bg}`)
      const c = contraste(lc, bg)
      assert.ok(c >= 3, `--line-control ${lc} sobre ${bg} = ${c.toFixed(2)}:1 (< 3:1)`)
    }],
    ['VIS-003: el chip usa --line-control (no el borde decorativo de tarjeta)', () => {
      const b = bloque(css, '.kt-media-chip')
      assert.ok(b, 'no está la regla .kt-media-chip')
      assert.match(b, /border:\s*1px solid var\(--line-control\)/)
    }],
    ['VIS-004: la miniatura actual NO usa outline (ése es el del foco); se marca con ::after interior', () => {
      const on = bloque(css, '.kt-media-thumb.is-on')
      assert.ok(on, 'no está la regla .kt-media-thumb.is-on')
      assert.doesNotMatch(on, /outline/, 'is-on usa outline: pisa el anillo de foco y se ven igual')
      const after = bloque(css, '.kt-media-thumb.is-on::after')
      assert.ok(after, 'no está .kt-media-thumb.is-on::after')
      assert.match(after, /border:\s*2px solid var\(--primary\)/)
      assert.match(css, /\.kt-media-thumb:focus-visible[\s\S]{0,200}outline:\s*2px solid var\(--primary\);\s*outline-offset:\s*2px/)
    }],
    ['REG-001: ProductMedia usa los helpers (no duplica la lógica)', () => {
      assert.match(mediaJsx, /import \{[^}]*contarYFiltrar[^}]*\} from '..\/helpers\/mediaHelpers'/)
      assert.match(mediaJsx, /mostrarVerLos\(visibles\.length\)/)
      assert.match(mediaJsx, /!hayMedia\(items\)\) return null/)
      assert.doesNotMatch(mediaJsx, /visibles\.length > 6/)
    }],
    ['VIS-001: la ficha engancha el reveal con useRevealSections, sin deps a mano', () => {
      assert.match(pagina, /const detailBodyRef = useRevealSections\(\)/)
      assert.doesNotMatch(pagina, /productBlogs\.length\]\)/, 'quedó una dep a mano en el reveal')
      assert.doesNotMatch(pagina, /scope\.querySelectorAll\(\s*'\.kt-detail-anim/, 'quedó el observer viejo en la página')
    }],
  ]
}

function correr(lista) {
  const fallas = []
  for (const [nombre, fn] of lista) {
    try {
      fn()
    } catch (e) {
      fallas.push({ nombre, error: String(e.message).split('\n')[0] })
    }
  }
  return fallas
}

let ok = 0
const reporta = (cond, msg) => {
  if (!cond) {
    console.error(`  ✘ ${msg}`)
    process.exitCode = 1
  } else {
    ok += 1
    console.log(`  ✔ ${msg}`)
  }
}

const fuentes = { h: real, css: leer(RUTAS.css), mediaJsx: leer(RUTAS.media), pagina: leer(RUTAS.pagina) }

console.log('Unidad + fuentes')
const fallasReales = correr(casos(fuentes))
for (const [nombre] of casos(fuentes)) {
  const f = fallasReales.find((x) => x.nombre === nombre)
  reporta(!f, f ? `${nombre} → ${f.error}` : nombre)
}

// ───────────────────────────── 3 · mutaciones sobre COPIAS ─────────────────────────────
const MUTACIONES = [
  // [archivo, nombre, desde, hacia]
  ['helpers', '«Ver los»: > pasa a >=', 'n > LIMITE_CELULAR', 'n >= LIMITE_CELULAR'],
  ['helpers', 'formatearDuracion: 0 deja de ser vacío', 'seg <= 0', 'seg < 0'],
  ['helpers', 'formatearDuracion: NaN deja de ser vacío', '!Number.isFinite(seg) || ', ''],
  ['helpers', 'formatearDuracion: sin relleno de segundos', "padStart(2, '0')", "padStart(1, '0')"],
  ['helpers', 'itemsValidos: acepta ítems sin url', 'm && m.url', 'm'],
  ['helpers', 'hayDeAmbos: && pasa a ||', 'fotos.length > 0 && videos.length > 0', 'fotos.length > 0 || videos.length > 0'],
  ['helpers', 'activo: el filtro se aplica aunque no haya de ambos', "hayDeAmbos ? filtro : 'all'", 'filtro'],
  ['helpers', "filtro «video» devuelve fotos", "activo === 'video' ? videos : lista", "activo === 'video' ? fotos : lista"],
  ['helpers', 'videoFrameSrc: duplica el #t', "url.includes('#') ? url :", 'false ? url :'],
  ['helpers', 'hayMedia: [] cuenta como media', 'itemsValidos(items).length > 0', 'itemsValidos(items).length >= 0'],
  ['css', 'VIS-003: --line-control vuelve a un gris de tarjeta', '--line-control: #6b6b6b', '--line-control: #2a2a2a'],
  ['css', 'VIS-003: el chip vuelve a --line2', 'border: 1px solid var(--line-control);\n    border-radius: 999px', 'border: 1px solid var(--line2);\n    border-radius: 999px'],
  ['css', 'VIS-004: la actual vuelve a usar outline', '.kt-media-thumb.is-on { opacity: 1; }', '.kt-media-thumb.is-on { opacity: 1; outline: 2px solid var(--primary); }'],
  ['mediaJsx', 'REG-001: «Ver los» vuelve a la cuenta suelta', 'mostrarVerLos(visibles.length)', 'visibles.length > 6'],
  ['pagina', 'VIS-001: la ficha deja de usar el hook', 'const detailBodyRef = useRevealSections()', 'const detailBodyRef = useRef(null)'],
  ['pagina', 'VIS-001: vuelve una dep a mano', '  // Reveal de las secciones de la ficha', '  useEffect(() => {}, [product, productBlogs.length])\n  // Reveal de las secciones de la ficha'],
]

console.log('\nMutaciones (cada una sobre una copia; tienen que dar ROJO)')
const tmp = mkdtempSync(join(tmpdir(), 'check-media-'))
try {
  let n = 0
  for (const [archivo, nombre, desde, hacia] of MUTACIONES) {
    const original = archivo === 'helpers' ? leer(RUTAS.helpers) : fuentes[archivo]
    const veces = original.split(desde).length - 1
    if (veces !== 1) {
      reporta(false, `mutación «${nombre}»: el texto a mutar aparece ${veces} veces (tiene que ser 1) — actualizá la mutación`)
      continue
    }
    const mutado = original.replace(desde, () => hacia)
    const copia = { ...fuentes }
    if (archivo === 'helpers') {
      const f = join(tmp, `helpers-${n++}.mjs`)
      writeFileSync(f, mutado)
      copia.h = await import(pathToFileURL(f).href)
    } else {
      copia[archivo] = mutado
    }
    const rojas = correr(casos(copia))
    reporta(rojas.length > 0, `mutación «${nombre}» → ${rojas.length > 0 ? `ROJO (${rojas.length}: ${rojas[0].nombre})` : 'NADIE se enteró (el check no la detecta)'}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

// ───────────────────────────── 4 · E2E con la API interceptada ─────────────────────────────
async function e2e() {
  const { default: puppeteer } = await import('puppeteer')
  const BASE = (process.env.KT_BASE || 'http://127.0.0.1:5173').replace(/\/$/, '')
  const MOCK = 'http://mock.local'
  // La receta documentada (REG-005) levanta el vite con `VITE_API_BASE_URL=http://api.qa.invalid/api`: http y host de QA. Se interceptan también.
  const API_PROD = /^https?:\/\/api\.(soytiendita\.store|dev\.tiendita\.com\.ar|qa\.invalid)\/api(\/.*)$/
  const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
  const VIDEO = resolve(raiz, 'public/assets/shop-section-bg.mp4')
  const cors = {
    'Access-Control-Allow-Origin': BASE,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'X-Account-Host, Content-Type, Accept, X-Requested-With, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  }
  const estado = { leak: 0, bloqueados: [], galeria: [] }

  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
    assert.ok(r.ok || r.status < 500)
  } catch (e) {
    reporta(false, `E2E: no hay un vite en ${BASE} (${e.message}). Levantalo y pasá KT_BASE, o corré con --sin-e2e`)
    return
  }

  const NOTA = [{ id: 9, slug: 'calibrar-cmy', titulo: 'Cómo calibrar la mezcla CMY', excerpt: 'Paso a paso.', published_at: '2026-10-01', contenido: '', media: [] }]

  // La respuesta de la API interceptada (sin demora). `modo` '500' hace fallar la media del producto.
  function responder(url, prod, modo, metodo) {
    const json = (status, body) => ({ status, headers: cors, contentType: 'application/json', body })
    if (modo === '500' && url.pathname === '/api/public/galeria' && prod) return json(500, '{"error":"boom"}')
    if (url.pathname === '/api/public/blog' && prod === 'hs1') return json(200, JSON.stringify(NOTA))
    if (url.pathname === '/video/obra.mp4') return { status: 200, headers: cors, contentType: 'video/mp4', body: readFileSync(VIDEO) }
    const out = { status: 404, headers: {}, body: '' }
    const res = { writeHead: (s, hd) => { out.status = s; Object.assign(out.headers, hd) }, end: (b) => { out.body = b ?? '' } }
    const sendJson = (_res, s, obj) => { out.status = s; out.headers['Content-Type'] = 'application/json'; out.body = JSON.stringify(obj) }
    if (!handlePublic({ method: metodo }, res, url, MOCK, sendJson)) return json(200, '[]')
    return { status: out.status, headers: { ...cors, ...out.headers }, body: out.body }
  }

  // `retraso` = { galeria, blog } en ms: cada sección de la ficha resuelve SU fetch cuando quiere, y «En obra» /
  // «Notas relacionadas» se montan DESPUÉS del primer render (justo el caso que el observer viejo no cubría).
  async function pagina(browser, ancho, alto, modo = 'normal', retraso = {}) {
    const p = await browser.newPage()
    await p.setViewport({ width: ancho, height: alto })
    await p.setRequestInterception(true)
    p.on('request', (r) => {
      const u = r.url()
      const m = API_PROD.exec(u)
      // El traductor también es de producción: se contesta 503 desde acá (la ficha cae a su texto original).
      if (/^https:\/\/translate\.soytiendita\.store\//.test(u)) {
        if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: cors, body: '' })
        return r.respond({ status: 503, headers: cors, contentType: 'application/json', body: '{}' })
      }
      // Cualquier otro pedido a producción NO sale: se aborta y se cuenta.
      if (!m && HOST_PROD.test(u)) {
        estado.leak += 1
        estado.bloqueados.push(u)
        return r.abort()
      }
      if (!m && !u.startsWith(MOCK)) return r.continue()
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: cors, body: '' })
      const url = new URL(m ? `${MOCK}/api${m[2]}` : u)
      const prod = url.searchParams.get('producto_id')
      if (url.pathname === '/api/public/galeria') estado.galeria.push(`${url.pathname}${url.search}`)
      const demora = !prod ? 0 : url.pathname === '/api/public/galeria' ? retraso.galeria : url.pathname === '/api/public/blog' ? retraso.blog : 0
      const respuesta = responder(url, prod, modo, r.method())
      if (demora) setTimeout(() => r.respond(respuesta).catch(() => {}), demora)
      else r.respond(respuesta).catch(() => {})
    })
    return p
  }

  const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
  // Baja hasta la sección como lo haría una persona y espera a que el reveal la prenda.
  async function opacidadTrasScroll(p, sel) {
    await p.waitForSelector(sel, { timeout: 15000 })
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel)
    try {
      await p.waitForFunction((s) => getComputedStyle(document.querySelector(s)).opacity === '1', { timeout: 4000 }, sel)
    } catch { /* se mide igual abajo */ }
    return p.evaluate((s) => Number(getComputedStyle(document.querySelector(s)).opacity), sel)
  }

  const browser = await puppeteer.launch({ headless: true })
  try {
    for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
      console.log(`\nE2E ${ancho}x${alto} (API interceptada, base ${BASE})`)
      // La media llega 1,5 s DESPUÉS que las notas: «En obra» se monta cuando el efecto del reveal ya corrió.
      const p = await pagina(browser, ancho, alto, 'normal', { galeria: 1500 })
      await p.goto(`${BASE}/producto/hs1`, { waitUntil: 'networkidle0', timeout: 60000 })
      reporta(estado.galeria.some((g) => g.includes('producto_id=hs1')), 'pide /public/galeria?producto_id=hs1')
      const op = await opacidadTrasScroll(p, '#media')
      reporta(op === 1, `VIS-001 «En obra» queda opacity 1 (medido: ${op})`)
      const opNotas = await opacidadTrasScroll(p, '#product-blogs')
      reporta(opNotas === 1, `VIS-001 «Notas relacionadas» queda opacity 1 (medido: ${opNotas})`)

      const f = await p.evaluate(() => {
        const sec = document.querySelector('#media')
        const vis = (el) => el && getComputedStyle(el).display !== 'none'
        const more = sec.querySelector('.kt-media-more')
        return {
          chips: [...sec.querySelectorAll('.kt-media-chip')].map((c) => `${c.textContent.replace(/\s+/g, ' ').trim()}|${c.getAttribute('aria-pressed')}`),
          cards: sec.querySelectorAll('.kt-media-card').length,
          visibles: [...sec.querySelectorAll('.kt-media-card')].filter(vis).length,
          more: more && vis(more) ? more.textContent.trim() : null,
          chipBorde: getComputedStyle(sec.querySelector('.kt-media-chip:not([aria-pressed="true"])')).borderTopColor,
          tab: [...document.querySelectorAll('button, a')].some((b) => /en obra/i.test(b.textContent)),
        }
      })
      reporta(f.chips.length === 3 && /todo · 7/i.test(f.chips[0]), `3 chips, el primero «Todo · 7»: ${f.chips.join(' / ')}`)
      reporta(/fotos · 4/i.test(f.chips[1] || '') && /videos · 3/i.test(f.chips[2] || ''), 'chip Fotos · 4 y Videos · 3')
      reporta(f.cards === 7, `7 tarjetas en el DOM (hay ${f.cards})`)
      reporta(f.tab, 'la lengüeta «En obra» existe')
      reporta(f.chipBorde === 'rgb(107, 107, 107)', `VIS-003 borde del chip inactivo = --line-control (medido ${f.chipBorde})`)
      if (ancho < 640) {
        reporta(f.visibles === 6 && f.more === 'Ver los 7', `celular: 6 visibles y «Ver los 7» (medido ${f.visibles} / ${f.more})`)
        await p.click('#media .kt-media-more')
        const despues = await p.evaluate(() => [[...document.querySelectorAll('#media .kt-media-card')].filter((e) => getComputedStyle(e).display !== 'none').length, !!document.querySelector('#media .kt-media-more')])
        reporta(despues[0] === 7 && despues[1] === false, `«Ver los 7» expande a 7 y desaparece (medido ${despues})`)
      } else {
        reporta(f.visibles === 7 && f.more === null, `escritorio: 7 visibles y sin «Ver los» (medido ${f.visibles} / ${f.more})`)
      }

      // Filtro: Fotos → 4, vuelve a Todo → 7.
      await p.click('#media .kt-media-chip:nth-child(2)')
      const soloFotos = await p.evaluate(() => [...document.querySelectorAll('#media .kt-media-card')].length)
      reporta(soloFotos === 4, `filtro Fotos → 4 tarjetas (medido ${soloFotos})`)
      await p.click('#media .kt-media-chip:nth-child(1)')

      // Visor: abre, la miniatura actual se marca distinta del foco, Escape cierra.
      await p.click('#media .kt-media-card:nth-child(1) .kt-media-item')
      await p.waitForSelector('.kt-media-viewer', { timeout: 5000 })
      const th = await p.evaluate(() => {
        const t = document.querySelector('.kt-media-thumb.is-on')
        if (!t) return null
        const a = getComputedStyle(t, '::after')
        return { borde: a.borderTopWidth, color: a.borderTopColor, outline: getComputedStyle(t).outlineStyle }
      })
      reporta(th && th.borde === '2px' && th.outline === 'none', `VIS-004 miniatura actual: anillo interior 2px y sin outline (medido ${JSON.stringify(th)})`)
      await p.keyboard.press('Escape')
      await pausa(200)
      reporta(!(await p.$('.kt-media-viewer')), 'Escape cierra el visor')
      await p.close()
    }

    {
      console.log('\nE2E al revés: las NOTAS llegan tarde y la media primero (1440x900)')
      const p = await pagina(browser, 1440, 900, 'normal', { blog: 1500 })
      await p.goto(`${BASE}/producto/hs1`, { waitUntil: 'networkidle0', timeout: 60000 })
      const opM = await opacidadTrasScroll(p, '#media')
      const opN = await opacidadTrasScroll(p, '#product-blogs')
      reporta(opM === 1 && opN === 1, `VIS-001 notas tardías: «En obra» ${opM} y «Notas relacionadas» ${opN} (los dos 1)`)
      await p.close()
    }

    console.log('\nE2E otros productos y falla de la API')
    {
      const p = await pagina(browser, 1440, 900)
      await p.goto(`${BASE}/producto/fotos`, { waitUntil: 'networkidle0', timeout: 60000 })
      await p.waitForSelector('#media', { timeout: 15000 })
      const r = await p.evaluate(() => ({ chips: document.querySelectorAll('#media .kt-media-chip').length, cards: document.querySelectorAll('#media .kt-media-card').length }))
      reporta(r.chips === 0 && r.cards === 3, `sólo fotos: sin chips y 3 tarjetas (medido ${JSON.stringify(r)})`)
      await p.close()
    }
    {
      const p = await pagina(browser, 1440, 900)
      await p.goto(`${BASE}/producto/vacio`, { waitUntil: 'networkidle0', timeout: 60000 })
      await pausa(1200)
      const r = await p.evaluate(() => ({ seccion: !!document.querySelector('#media'), tab: [...document.querySelectorAll('button, a')].some((b) => /en obra/i.test(b.textContent)) }))
      reporta(!r.seccion && !r.tab, `sin media: ni sección ni lengüeta (medido ${JSON.stringify(r)})`)
      await p.close()
    }
    {
      const p = await pagina(browser, 1440, 900, '500')
      await p.goto(`${BASE}/producto/hs1`, { waitUntil: 'networkidle0', timeout: 60000 })
      await pausa(1200)
      const r = await p.evaluate(() => ({ seccion: !!document.querySelector('#media'), ficha: !!document.querySelector('#about') }))
      reporta(!r.seccion && r.ficha, `API de media en 500: la ficha sigue y «En obra» no se dibuja (medido ${JSON.stringify(r)})`)
      await p.close()
    }
  } finally {
    await browser.close()
  }

  console.log(`\nPROD_LEAK ${estado.leak}${estado.bloqueados.length ? ` → ${[...new Set(estado.bloqueados)].join(', ')}` : ''}`)
  reporta(estado.leak === 0, 'PROD_LEAK 0: ningún pedido salió hacia producción')
}

if (SIN_E2E) {
  console.log('\n  · --sin-e2e: no se corre el recorrido en navegador')
} else {
  await e2e()
}

console.log(`\ncheck-media: ${ok} OK${process.exitCode ? ' — HAY FALLAS' : ''}`)
