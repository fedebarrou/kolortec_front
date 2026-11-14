/**
 * check-ficha-flechas-navegador.mjs — en la ficha de producto, al pasar de foto NO se mueven las flechas ni lo que
 * está debajo (14-nov-2026, pedido de Fedev: «al cambiar el tamaño de la imagen se mueven las arrow y es mala
 * experiencia»).
 *
 * Por qué pasaba: el visor medía lo que medía la foto del momento. Con fotos de proporciones distintas (una
 * cuadrada, una apaisada, una vertical) el alto cambiaba en cada paso, y las flechas —centradas contra ese alto— y
 * las miniaturas de abajo saltaban. Ahora el visor toma la proporción de la PRIMERA foto y la mantiene: las demás
 * entran enteras adentro (contain), sin recortarse.
 *
 * Se prueba en un navegador real, con la API pública mockeada por intercepción y tres fotos de proporciones
 * distintas, a 1440 y a 390:
 *   · las flechas quedan en el mismo lugar con cada foto, y también apenas se pasa (antes de que termine de pintar);
 *   · el visor no cambia de alto y la tira de miniaturas no se mueve;
 *   · cada foto se ve entera (su proporción no se deforma ni se recorta) y centrada;
 *   · la primera foto se ve a su tamaño natural: el visor mide lo que mide ella.
 *
 *   node scripts/check-ficha-flechas-navegador.mjs                    → levanta vite en KT_PORT (5195)
 *   KT_BASE=http://127.0.0.1:5173 node scripts/check-ficha-flechas-navegador.mjs
 */
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
const prodLeak = []

const PORT = process.env.KT_PORT || '5195'
const BASE = (process.env.KT_BASE || `http://127.0.0.1:${PORT}`).replace(/\/$/, '')
// Sólo contra un servidor LOCAL (igual que los demás checks de navegador; sekh SEC-002).
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  console.error(`KT_BASE tiene que ser local (127.0.0.1 o localhost): ${BASE}`)
  process.exit(1)
}

// ---- datos falsos ----------------------------------------------------------------------------------------
const foto = (w, h, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${color}"/></svg>`
const FOTOS = { cuadrada: { w: 800, h: 800, svg: foto(800, 800, '#3a3a3a') }, apaisada: { w: 800, h: 450, svg: foto(800, 450, '#5a2a2a') }, vertical: { w: 600, h: 1000, svg: foto(600, 1000, '#2a2a5a') } }
const ORDEN = ['cuadrada', 'apaisada', 'vertical']
const url = (k) => `https://imagenes.test/${k}.svg`
const producto = (id, orden) => ({
  id, slug: id, nombre: `PRODUCTO ${id.toUpperCase()}`, categoria: 'Efectos', moneda: 'ARS', precio: null, descripcion: 'Producto de prueba.',
  img_url: url(orden[0]), imagenes: [], innovaciones: [], variantes: [], specs: [], docs: [],
  media: orden.map((k, i) => ({ id: `m${i}`, kind: 'image', tipo: 'imagen', url: url(k) })),
})
// `altas`: la primera foto es vertical y pasa el tope de alto del visor (como las fotos reales, 1536×1920).
const PRODUCTOS = [producto('fotos', ORDEN), producto('altas', ['vertical', 'apaisada'])]
const TOPE = (ancho) => (ancho <= 640 ? 520 : 760) // max-height del visor en index.css

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

async function abrir(browser, viewport, slug = 'fotos') {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.setRequestInterception(true)
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
  page.on('request', (req) => {
    const u = req.url()
    const img = u.match(/^https:\/\/imagenes\.test\/(\w+)\.svg/)
    if (img) {
      return req.respond({ status: 200, contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': BASE, 'cache-control': 'no-store' }, body: FOTOS[img[1]].svg })
    }
    if (!/\/api\/public\//.test(u) && HOST_PROD.test(u)) {
      prodLeak.push(u)
      return req.abort()
    }
    // Lista blanca: fuera de la API pública mockeada sólo sale lo que sirve el vite local.
    if (!/\/api\/public\//.test(u)) return u.startsWith(BASE + '/') || /^(data|blob):/.test(u) ? req.continue() : req.abort()
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { ...cors, 'access-control-allow-headers': req.headers()['access-control-request-headers'] || '' } })
    const body = /\/public\/productos(\?.*)?$/.test(u) ? JSON.stringify(PRODUCTOS) : '[]'
    return req.respond({ status: 200, contentType: 'application/json', headers: cors, body })
  })
  await page.goto(`${BASE}/producto/${slug}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('.kt-detail-name') && document.querySelector('.kt-detail-image img')?.dataset.cargada, { timeout: 30000 })
  await page.addStyleTag({ content: '.kt-reveal-item,.kt-detail-anim{opacity:1!important;transform:none!important;transition:none!important}' })
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await espera(600)
  return page
}

/** Posiciones en coordenadas de PÁGINA (no dependen del scroll). */
const medir = (page) =>
  page.evaluate(() => {
    const fig = document.querySelector('.kt-detail-image')
    const img = fig.querySelector('img')
    const [prev, next] = fig.querySelectorAll('.kt-detail-arrow')
    const rail = document.querySelector('#gallery')
    const r = (e) => { const q = e.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height } }
    const caja = r(img.closest('.relative'))
    const ri = r(img)
    // lo DIBUJADO dentro de la caja del <img> (object-fit: contain)
    const nw = img.naturalWidth, nh = img.naturalHeight
    const escala = nw && nh ? Math.min(ri.w / nw, ri.h / nh) : 0
    return {
      src: (img.getAttribute('src') || '').replace(/^.*\/(\w+)\.svg.*$/, '$1'), cargada: !!img.dataset.cargada && img.complete && nw > 0,
      prevY: r(prev).y + r(prev).h / 2, nextY: r(next).y + r(next).h / 2, prevX: r(prev).x, nextX: r(next).x,
      cajaY: caja.y, cajaH: caja.h, cajaW: caja.w, cajaX: caja.x, figW: r(fig).w, figX: r(fig).x, railY: rail ? r(rail).y : null,
      dibujoW: nw * escala, dibujoH: nh * escala, imgW: ri.w, imgH: ri.h, imgY: ri.y, fit: getComputedStyle(img).objectFit,
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }
  })

const igual = (a, b, tol = 0.6) => Math.abs(a - b) <= tol

async function caso(browser, viewport) {
  console.log(`\n${viewport.width}px`)
  const page = await abrir(browser, viewport)
  const m0 = await medir(page)
  ok(m0.src === 'cuadrada' && m0.cargada, 'arranca en la primera foto, ya cargada', JSON.stringify(m0))
  ok(igual(m0.cajaH, m0.cajaW, 1.5), 'la primera foto (cuadrada) se ve a su tamaño natural: el visor mide lo que ella', `${m0.cajaW}×${m0.cajaH}`)
  ok(igual(m0.prevY, m0.cajaY + m0.cajaH / 2, 1) && igual(m0.nextY, m0.prevY), 'las flechas van centradas contra la foto', JSON.stringify(m0))
  ok(igual(m0.cajaW, m0.figW, 1) && igual(m0.cajaX, m0.figX, 1), 'el visor ocupa todo el ancho de su columna', `${m0.cajaW.toFixed(1)} de ${m0.figW.toFixed(1)}`)

  const pasar = () => page.evaluate(() => document.querySelector('.kt-detail-image .kt-marquee-arrow-next').click())
  const mismoLugar = (m, cuando) => {
    ok(igual(m.prevY, m0.prevY) && igual(m.nextY, m0.nextY) && igual(m.prevX, m0.prevX) && igual(m.nextX, m0.nextX), `${cuando}: las flechas no se mueven`, `prev ${m0.prevY.toFixed(1)} → ${m.prevY.toFixed(1)} · next ${m0.nextY.toFixed(1)} → ${m.nextY.toFixed(1)}`)
    ok(igual(m.cajaH, m0.cajaH) && igual(m.cajaY, m0.cajaY), `${cuando}: el visor no cambia de alto ni de lugar`, `${m0.cajaH.toFixed(1)} → ${m.cajaH.toFixed(1)}`)
    ok(m.railY === null || igual(m.railY, m0.railY), `${cuando}: las miniaturas de abajo no se mueven`, `${m0.railY} → ${m.railY}`)
  }
  const entera = (m, k) => {
    const f = FOTOS[k]
    ok(m.fit === 'contain' && igual(m.dibujoW / m.dibujoH, f.w / f.h, 0.01), `${k}: se ve entera y sin deformar`, `${m.dibujoW.toFixed(1)}×${m.dibujoH.toFixed(1)} (${m.fit})`)
    ok(m.dibujoW <= m.cajaW + 1 && m.dibujoH <= m.cajaH + 1 && (igual(m.dibujoW, m.cajaW, 2.5) || igual(m.dibujoH, m.cajaH, 2.5)), `${k}: entra en el visor y lo aprovecha (toca dos bordes)`, `dibujo ${m.dibujoW.toFixed(1)}×${m.dibujoH.toFixed(1)} en ${m.cajaW.toFixed(1)}×${m.cajaH.toFixed(1)}`)
  }

  // → apaisada
  await pasar()
  await page.waitForFunction(() => { const i = document.querySelector('.kt-detail-image img'); return /apaisada/.test(i.src) && i.dataset.cargada }, { timeout: 10000 })
  await espera(150)
  let m = await medir(page)
  mismoLugar(m, 'foto apaisada')
  entera(m, 'apaisada')

  // → vertical: se mide apenas se pasa (sin esperar) y después de cargada
  await pasar()
  m = await medir(page)
  mismoLugar(m, 'apenas se pasa a la vertical')
  await page.waitForFunction(() => { const i = document.querySelector('.kt-detail-image img'); return /vertical/.test(i.src) && i.dataset.cargada && i.naturalWidth > 0 }, { timeout: 10000 })
  await espera(150)
  m = await medir(page)
  mismoLugar(m, 'foto vertical')
  entera(m, 'vertical')

  // → vuelve a la primera (da la vuelta)
  await pasar()
  await page.waitForFunction(() => { const i = document.querySelector('.kt-detail-image img'); return /cuadrada/.test(i.src) && i.dataset.cargada }, { timeout: 10000 })
  await espera(150)
  m = await medir(page)
  mismoLugar(m, 'de vuelta en la primera')
  ok(m.sw <= m.cw, 'sin desborde horizontal', `${m.sw} > ${m.cw}`)
  await page.close()
}

/** Primera foto VERTICAL que pasa el tope de alto: el visor no se angosta ni se corre, y las flechas tampoco se mueven. */
async function casoAlta(browser, viewport) {
  console.log(`\n${viewport.width}px · primera foto vertical`)
  const page = await abrir(browser, viewport, 'altas')
  const m0 = await medir(page)
  const tope = TOPE(viewport.width)
  ok(m0.src === 'vertical' && m0.cargada, 'arranca en la foto vertical, ya cargada', JSON.stringify({ src: m0.src, cargada: m0.cargada }))
  ok(igual(m0.cajaW, m0.figW, 1) && igual(m0.cajaX, m0.figX, 1), 'el visor ocupa todo el ancho de su columna (no se angosta por el tope de alto)', `${m0.cajaW.toFixed(1)} de ${m0.figW.toFixed(1)}, x ${m0.cajaX.toFixed(1)} vs ${m0.figX.toFixed(1)}`)
  ok(m0.cajaH <= tope + 0.6, `el visor respeta el tope de alto (${tope}px)`, `${m0.cajaH.toFixed(1)}`)
  ok(igual(m0.dibujoW / m0.dibujoH, FOTOS.vertical.w / FOTOS.vertical.h, 0.01) && m0.dibujoH <= m0.cajaH + 1, 'la foto vertical se ve entera', `${m0.dibujoW.toFixed(1)}×${m0.dibujoH.toFixed(1)}`)
  ok(igual(m0.prevY, m0.cajaY + m0.cajaH / 2, 1), 'las flechas van centradas contra el visor')
  await page.evaluate(() => document.querySelector('.kt-detail-image .kt-marquee-arrow-next').click())
  await page.waitForFunction(() => { const i = document.querySelector('.kt-detail-image img'); return /apaisada/.test(i.src) && i.dataset.cargada }, { timeout: 10000 })
  await espera(150)
  const m = await medir(page)
  ok(igual(m.prevY, m0.prevY) && igual(m.nextY, m0.nextY) && igual(m.prevX, m0.prevX) && igual(m.nextX, m0.nextX), 'al pasar a la apaisada las flechas no se mueven', `${m0.prevY.toFixed(1)} → ${m.prevY.toFixed(1)}`)
  ok(igual(m.cajaH, m0.cajaH) && (m.railY === null || igual(m.railY, m0.railY)), 'ni el visor ni las miniaturas cambian', `${m0.cajaH.toFixed(1)} → ${m.cajaH.toFixed(1)}`)
  await page.close()
}

let browser = null
try {
  await levantar()
  browser = await puppeteer.launch({ channel: 'chrome', headless: true })
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await caso(browser, viewport)
    await casoAlta(browser, viewport)
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
