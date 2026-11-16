/**
 * check-innovaciones-fondo-navegador.mjs — las imágenes de las innovaciones se ven SIN color de fondo (13-nov-2026,
 * pedido de Fedev: «a todas las imágenes de las innovaciones quitarle el bg color»; eligió sacar los dos: el negro
 * que pintaba el sitio y el fondo que trae cada archivo).
 *
 * Complementa a check-quitar-fondo.mjs (la función pura): acá se prueba en un navegador real lo que sólo existe con
 * canvas, CORS y CSS, en las DOS presentaciones de la ficha de producto, con la API pública mockeada por intercepción:
 *   · recuadro + grilla (imagen cuadrada) con 4 y con 6 innovaciones — desde el 14-nov-2026 ya no hay lista para las de 4 o menos;
 *   · archivo con fondo negro y con fondo blanco, servidos CON CORS → la imagen que se muestra tiene las esquinas
 *     transparentes y el dibujo opaco;
 *   · una «foto» (sin fondo liso) → queda entera, no se agujerea;
 *   · archivo servido SIN CORS (no se pueden leer los píxeles, como en localhost) → se muestra tal cual;
 *   · en TODOS los casos el <img> no tiene color de fondo propio (el sitio ya no pinta negro detrás).
 *
 *   node scripts/check-innovaciones-fondo-navegador.mjs                    → levanta vite en KT_PORT (5194)
 *   KT_BASE=http://127.0.0.1:5173 node scripts/check-innovaciones-fondo-navegador.mjs
 */
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
const prodLeak = []

const PORT = process.env.KT_PORT || '5194'
const BASE = (process.env.KT_BASE || `http://127.0.0.1:${PORT}`).replace(/\/$/, '')
// Sólo contra un servidor LOCAL (igual que check-tira-marcas-navegador; sekh SEC-002).
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  console.error(`KT_BASE tiene que ser local (127.0.0.1 o localhost): ${BASE}`)
  process.exit(1)
}

// ---- datos falsos ----------------------------------------------------------------------------------------
// 160×90 como los archivos reales: un fondo liso y un rectángulo amarillo en el medio.
const dibujo = (fondo) => `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90" shape-rendering="crispEdges"><rect width="160" height="90" fill="${fondo}"/><rect x="50" y="25" width="60" height="40" fill="#f4df33"/></svg>`
// «foto»: cuatro cuadrantes de colores distintos, sin fondo liso
const FOTO = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90" shape-rendering="crispEdges"><rect width="80" height="45" fill="#a03020"/><rect x="80" width="80" height="45" fill="#2060a0"/><rect y="45" width="80" height="45" fill="#208040"/><rect x="80" y="45" width="80" height="45" fill="#c0c0c0"/></svg>`
// dibujo OSCURO sobre fondo claro: sin el fondo no se vería sobre la tarjeta oscura → no se le quita
const OSCURO = dibujo('#ffffff').replace('#f4df33', '#222222')
const IMAGENES = { negro: dibujo('#000000'), blanco: dibujo('#ffffff'), foto: FOTO, sincors: dibujo('#000000'), oscuro: OSCURO }
// cuántas veces se pidió cada imagen, con y sin el parámetro de CORS: tiene que bajarse UNA sola vez
const pedidos = []
const url = (k) => `https://imagenes.test/${k}.svg`

const innov = (nombre, k) => ({ nombre, descripcion: `Descripción de ${nombre}.`, media_url: k ? url(k) : null })
const producto = (id, innovaciones) => ({
  id, slug: id, nombre: `PRODUCTO ${id.toUpperCase()}`, categoria: 'Efectos', moneda: 'ARS', precio: null,
  descripcion: 'Producto de prueba.', img_url: '', imagenes: [], innovaciones, variantes: [], specs: [], docs: [], media: [],
})
const PRODUCTOS = [
  producto('lista', [innov('NEGRO', 'negro'), innov('BLANCO', 'blanco'), innov('FOTO', 'foto'), innov('SIN CORS', 'sincors')]),
  producto('grilla', [innov('NEGRO', 'negro'), innov('BLANCO', 'blanco'), innov('FOTO', 'foto'), innov('SIN CORS', 'sincors'), innov('SIN IMAGEN', null), innov('OSCURO', 'oscuro')]),
]

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

async function abrir(browser, slug, viewport) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.setRequestInterception(true)
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
  page.on('request', (req) => {
    const u = req.url()
    const img = u.match(/^https:\/\/imagenes\.test\/(\w+)\.svg/)
    if (img) {
      pedidos.push({ slug, ancho: viewport.width, imagen: img[1], conCors: /[?&]cors=/.test(u) })
      // «sincors» se sirve sin la cabecera: el pedido con crossOrigin falla y los píxeles no se pueden leer.
      const headers = img[1] === 'sincors' ? {} : { 'access-control-allow-origin': BASE }
      return req.respond({ status: 200, contentType: 'image/svg+xml', headers, body: IMAGENES[img[1]] })
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
  await page.waitForFunction(() => document.querySelector('.kt-detail-name'), { timeout: 30000 })
  await page.waitForFunction((n) => document.querySelectorAll('img[data-icono]').length >= n, { timeout: 30000 }, 4)
  // Las imágenes son loading=lazy: se piden recién al acercarse a la pantalla. Se pasa por cada una (también las de
  // la segunda página del carrusel en celular), como haría quien recorre la ficha.
  for (const img of await page.$$('img[data-icono]')) {
    await img.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
    await espera(150)
  }
  await espera(900) // carga + lectura en canvas
  return page
}

/** Por cada <img data-icono>: de dónde sale, su fondo CSS y el alfa/color de sus píxeles tal como se MUESTRAN. */
const medir = (page) =>
  page.evaluate(async () => {
    const out = []
    for (const img of document.querySelectorAll('img[data-icono]')) {
      const base = { opacidad: getComputedStyle(img).opacity, ancho: img.getBoundingClientRect().width, icono: img.dataset.icono, fondo: img.dataset.fondo || null, esData: img.src.startsWith('data:'), src: img.src.slice(0, 40), bg: getComputedStyle(img).backgroundColor, nombre: img.closest('.kt-innov-ficha, article, .kt-innov-detalle-item')?.textContent.trim().slice(0, 12) }
      if (!base.esData) {
        out.push(base) // el archivo tal cual: no se puede (ni hace falta) leerle los píxeles
        continue
      }
      await img.decode().catch(() => {})
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data)
      out.push({ ...base, w: c.width, h: c.height, esquinas: [px(0, 0), px(c.width - 1, 0), px(0, c.height - 1), px(c.width - 1, c.height - 1)].map((p) => p[3]), centro: px(Math.floor(c.width / 2), Math.floor(c.height / 2)) })
    }
    return out
  })

const TRANSPARENTE = 'rgba(0, 0, 0, 0)'
const esAmarillo = (p) => p && Math.abs(p[0] - 244) < 12 && Math.abs(p[1] - 223) < 12 && Math.abs(p[2] - 51) < 12 && p[3] === 255

async function caso(browser, slug, viewport, iconoEsperado) {
  console.log(`\n${slug} · ${viewport.width}px`)
  const page = await abrir(browser, slug, viewport)
  // KT_CAPTURA=carpeta: deja una captura de cada caso, para MIRAR cómo queda (lo visual se decide viendo).
  if (process.env.KT_CAPTURA) {
    await page.addStyleTag({ content: '.kt-reveal-item{opacity:1!important;transform:none!important;transition:none!important}' })
    const zona = await page.$('.kt-innov')
    await zona.evaluate((e) => (e.closest('.grid') || e).scrollIntoView({ block: 'center' }))
    await espera(300)
    await page.screenshot({ path: `${process.env.KT_CAPTURA}/innov-${slug}-${viewport.width}.png` })
  }
  const m = await medir(page)
  const de = (nombre) => m.filter((x) => x.nombre?.startsWith(nombre))
  ok(m.length >= 4, 'hay imágenes de innovaciones', `${m.length}`)
  ok(m.every((x) => x.bg === TRANSPARENTE), 'ninguna imagen tiene color de fondo propio (el sitio ya no pinta negro)', m.filter((x) => x.bg !== TRANSPARENTE).map((x) => `${x.nombre}: ${x.bg}`).join(' · '))
  for (const nombre of ['NEGRO', 'BLANCO']) {
    const xs = de(nombre)
    ok(xs.length > 0 && xs.every((x) => x.esData && x.icono === iconoEsperado), `fondo ${nombre.toLowerCase()}: se muestra la copia procesada (${iconoEsperado})`, xs.map((x) => `${x.icono}/${x.src}`).join(' · '))
    ok(xs.length > 0 && xs.every((x) => x.esquinas?.every((a) => a === 0)), `fondo ${nombre.toLowerCase()}: las cuatro esquinas quedan transparentes`, xs.map((x) => x.esquinas?.join(',')).join(' · '))
    ok(xs.length > 0 && xs.every((x) => esAmarillo(x.centro)), `fondo ${nombre.toLowerCase()}: el dibujo queda opaco y con su color`, xs.map((x) => x.centro?.join(',')).join(' · '))
  }
  const fotos = de('FOTO')
  if (iconoEsperado === 'cuadrado') {
    ok(fotos.length > 0 && fotos.every((x) => !x.esData && x.fondo === 'original'), 'foto (sin fondo liso): se muestra el archivo tal cual', fotos.map((x) => `${x.fondo}/${x.src}`).join(' · '))
  } else {
    ok(fotos.length > 0 && fotos.every((x) => x.esData && x.centro?.[3] === 255), 'foto (sin fondo liso): no se agujerea (el centro sigue opaco)', fotos.map((x) => x.centro?.join(',')).join(' · '))
  }
  ok(m.every((x) => x.opacidad === '1' && x.fondo !== 'leyendo' && x.ancho > 0), 'ninguna imagen queda invisible ni a medio leer', m.filter((x) => x.opacidad !== '1' || x.fondo === 'leyendo').map((x) => `${x.nombre}: ${x.fondo}/${x.opacidad}`).join(' · '))
  // UNA sola descarga (joan REG-004, sekh SEC-001): las que se pueden leer nunca se piden además sin CORS.
  const mios = pedidos.filter((p) => p.slug === slug && p.ancho === viewport.width)
  const planos = mios.filter((p) => !p.conCors && p.imagen !== 'sincors')
  ok(mios.some((p) => p.conCors) && planos.length === 0, 'las imágenes legibles se piden sólo con CORS, no dos veces', planos.map((p) => p.imagen).join(' · '))
  const sin = de('SIN CORS')
  ok(sin.length > 0 && sin.every((x) => !x.esData && x.src.startsWith('https://imagenes.test/sincors')), 'sin CORS: se muestra el archivo tal cual, sin romperse', sin.map((x) => `${x.icono}/${x.src}`).join(' · '))
  if (slug === 'grilla') { // sólo ese producto trae la innovación oscura y la que no tiene imagen
    const oscuros = de('OSCURO')
    ok(oscuros.length > 0 && oscuros.every((x) => !x.esData && x.fondo === 'original'), 'dibujo oscuro sobre fondo claro: NO se le quita el fondo (si no, no se vería)', oscuros.map((x) => `${x.fondo}/${x.src}`).join(' · '))
    ok(m.filter((x) => x.fondo === 'quitado').length >= 3, 'grilla: las fichas y el recuadro marcan data-fondo="quitado"', `${m.filter((x) => x.fondo === 'quitado').length}`)
    ok(await page.$$eval('.kt-innov-inicial', (xs) => xs.length) >= 1, 'la innovación sin imagen sigue mostrando su inicial')
  }
  await page.close()
}

let browser = null
try {
  await levantar()
  browser = await puppeteer.launch({ channel: 'chrome', headless: true })
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await caso(browser, 'lista', viewport, 'cuadrado') // 4 innovaciones: desde el 14-nov-2026 también van en grilla
    await caso(browser, 'grilla', viewport, 'cuadrado')
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
