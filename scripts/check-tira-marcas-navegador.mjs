/**
 * check-tira-marcas-navegador.mjs — la tira de marcas de la home (PartnersStrip) gira SIN COSTURA (13-nov-2026,
 * pedido de Fedev: «el carrusel de las marcas debe ser infinito y no tener corte de inicio fin»).
 *
 * El keyframe `kt-marquee-scroll` desplaza el track media pista y vuelve a empezar. Para que esa vuelta no se vea,
 * la segunda mitad del track tiene que ser IDÉNTICA a la primera, píxel por píxel y EN TODO MOMENTO. Acá se mide
 * eso en un navegador real, con la API pública mockeada por intercepción (no pega a ningún servidor):
 *   · cada item mide lo mismo que su copia de la otra mitad (también mientras los logos están cargando: las copias
 *     son loading=lazy y las que están fuera de pantalla no cargan hasta acercarse);
 *   · la distancia entre un item y su copia es EXACTAMENTE lo que recorre el keyframe (leído de la animación real);
 *   · media pista alcanza para tapar el contenedor (no gira medio vacía).
 * Con marcas con logo (proporciones distintas, uno que tarda) y con marcas de sólo texto, a 1440 y a 390.
 *
 *   node scripts/check-tira-marcas-navegador.mjs                       → levanta vite en KT_PORT (5193)
 *   KT_BASE=http://127.0.0.1:5173 node scripts/check-tira-marcas-navegador.mjs   → usa uno que ya está corriendo
 */
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

// Guarda contra producción (la misma de check-innovaciones-navegador): lo que no sea la API pública interceptada y
// vaya a estos hosts se ABORTA y se cuenta; con PROD_LEAK > 0 el check falla.
const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
const prodLeak = []

const PORT = process.env.KT_PORT || '5193'
const BASE = (process.env.KT_BASE || `http://127.0.0.1:${PORT}`).replace(/\/$/, '')
// Sólo contra un servidor LOCAL: con KT_BASE apuntando a un sitio publicado el check lo navegaría (sekh SEC-002).
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  console.error(`KT_BASE tiene que ser local (127.0.0.1 o localhost): ${BASE}`)
  process.exit(1)
}

// ---- datos falsos ----------------------------------------------------------------------------------------
// Logos SVG de proporciones bien distintas: apaisado, cuadrado, muy apaisado, vertical.
const LOGOS = { ancho: [300, 100], cuadrado: [120, 120], tira: [480, 80], alto: [100, 160] }
const svg = ([w, h]) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f4df33"/></svg>`
const LENTO = 'tira' // este tarda en responder: durante un rato hay copias cargadas y copias sin cargar
const marcasConLogo = Object.keys(LOGOS).map((k, i) => ({ id: k, nombre: `Marca ${k}`, logo_url: `https://logos.test/${k}.svg`, link: 'https://ejemplo.test', orden: i + 1, escala: i === 1 ? 1.4 : 1 }))
const marcasSinLogo = ['Alba', 'Sinteplast', 'Sherwin Williams', 'Tekno'].map((nombre, i) => ({ id: `t${i}`, nombre, logo_url: null, link: null, orden: i + 1, escala: 1 }))

// ---- mini framework --------------------------------------------------------------------------------------
let total = 0
const fallas = []
function ok(cond, nombre, detalle = '') {
  total += 1
  if (cond) console.log(`  ✔ ${nombre}`)
  else {
    fallas.push(nombre)
    console.log(`  ✘ ${nombre}${detalle ? `  → ${detalle}` : ''}`)
  }
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- servidor --------------------------------------------------------------------------------------------
let servidor = null
async function levantar() {
  if (process.env.KT_BASE) return
  servidor = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', PORT, '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(BASE + '/')).ok) return
    } catch { /* todavía no */ }
    await espera(500)
  }
  throw new Error('vite no levantó en ' + BASE)
}

// ---- página ----------------------------------------------------------------------------------------------
async function abrir(browser, { marcas, viewport }) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.setRequestInterception(true)
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
  page.on('request', async (req) => {
    const url = req.url()
    const logo = url.match(/^https:\/\/logos\.test\/(\w+)\.svg/)
    if (logo) {
      if (logo[1] === LENTO) await espera(1800)
      return req.respond({ status: 200, contentType: 'image/svg+xml', body: svg(LOGOS[logo[1]]) }).catch(() => {})
    }
    if (!/\/api\/public\//.test(url) && HOST_PROD.test(url)) {
      prodLeak.push(url)
      return req.abort()
    }
    // Lista BLANCA (sekh SEC-001): fuera de la API pública mockeada sólo sale lo que sirve el vite local.
    // Todo lo demás (fuentes, traductores, analíticas de terceros) se aborta sin contarlo como fuga.
    if (!/\/api\/public\//.test(url)) return url.startsWith(BASE + '/') || /^(data|blob):/.test(url) ? req.continue() : req.abort()
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { ...cors, 'access-control-allow-headers': req.headers()['access-control-request-headers'] || '' } })
    const body = /\/public\/marcas(\?.*)?$/.test(url) ? JSON.stringify(marcas) : '[]'
    return req.respond({ status: 200, contentType: 'application/json', headers: cors, body })
  })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.kt-partners-strip .kt-marquee-track', { timeout: 30000 })
  return page
}

const medir = (page) =>
  page.evaluate(() => {
    const cont = document.querySelector('.kt-partners-strip .kt-marquee')
    const track = cont.querySelector('.kt-marquee-track')
    const items = [...track.children]
    const r = items.map((el) => el.getBoundingClientRect())
    const mitad = items.length / 2
    const imgs = [...track.querySelectorAll('img')]
    // Lo que recorre el keyframe se LEE de la animación, no se recalcula con la fórmula (joan REG-001): se para el
    // reloj en 0 y en la mitad, se mira cuánto se movió el track y se deja el reloj como estaba. Así, si alguien
    // vuelve a escribir un valor fijo en el keyframe, esto lo ve.
    const anim = track.getAnimations()[0]
    let periodoKeyframe = null
    if (anim) {
      const d = Number(anim.effect.getComputedTiming().duration)
      const antes = anim.currentTime
      const x = (t) => { anim.currentTime = t; return new DOMMatrix(getComputedStyle(track).transform).m41 }
      periodoKeyframe = 2 * Math.abs(x(d / 2) - x(0))
      anim.currentTime = antes
    }
    return {
      n: items.length,
      anchos: r.map((x) => x.width),
      // distancia entre el primer item y su copia de la otra mitad = lo que hay que recorrer para que no se note
      periodoReal: Number.isInteger(mitad) ? r[mitad].left - r[0].left : null,
      periodoKeyframe,
      contenedor: cont.clientWidth,
      cargadas: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      imgs: imgs.length,
      girando: Boolean(anim),
    }
  })

async function caso(browser, nombre, marcas, viewport) {
  console.log(`\n${nombre} · ${viewport.width}px`)
  const page = await abrir(browser, { marcas, viewport })
  await page.evaluate(() => document.querySelector('.kt-partners-strip').scrollIntoView({ block: 'center' }))
  // tres momentos: recién en pantalla (logos a medio cargar), con el lento todavía pendiente, y todo asentado
  for (const [ms, momento] of [[500, 'recién en pantalla'], [900, 'cargando'], [3200, 'asentada']]) {
    await espera(ms)
    const m = await medir(page)
    const mitad = m.n / 2
    const pares = Number.isInteger(mitad) ? m.anchos.slice(0, mitad).map((w, i) => [i, w, m.anchos[i + mitad]]) : []
    const distintos = pares.filter(([, a, b]) => Math.abs(a - b) > 0.05)
    const sufijo = `${momento}${m.imgs ? ` (${m.cargadas}/${m.imgs} logos cargados)` : ''}`
    ok(Number.isInteger(mitad) && m.n >= marcas.length * 2, `${sufijo}: el track repite el set una cantidad par de veces`, `${m.n} items`)
    ok(distintos.length === 0, `${sufijo}: cada item mide lo mismo que su copia`, distintos.map(([i, a, b]) => `#${i}: ${a.toFixed(2)} vs ${b.toFixed(2)}`).join(' · '))
    ok(m.periodoReal !== null && m.periodoKeyframe !== null && Math.abs(m.periodoReal - m.periodoKeyframe) <= 0.1, `${sufijo}: la vuelta del keyframe cae justo sobre la copia`, `copia a ${m.periodoReal?.toFixed(2)}px · el keyframe recorre ${m.periodoKeyframe?.toFixed(2)}px`)
    ok(m.periodoKeyframe >= m.contenedor, `${sufijo}: media pista tapa el contenedor`, `${m.periodoKeyframe?.toFixed(0)} < ${m.contenedor}`)
    ok(m.girando, `${sufijo}: la tira está girando`)
  }
  await page.close()
}

// ---- corrida ---------------------------------------------------------------------------------------------
let browser = null
try {
  await levantar()
  browser = await puppeteer.launch({ channel: 'chrome', headless: true })
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await caso(browser, 'marcas con logo', marcasConLogo, viewport)
    await caso(browser, 'marcas de sólo texto', marcasSinLogo, viewport)
  }
  ok(prodLeak.length === 0, 'PROD_LEAK: ningún pedido salió hacia producción', prodLeak.slice(0, 3).join(' · '))
} catch (e) {
  fallas.push('excepción')
  console.error(e)
} finally {
  if (browser) await browser.close()
  if (servidor) servidor.kill()
}

console.log(`\n${total - fallas.length}/${total} OK`)
process.exit(fallas.length ? 1 : 0)
