/**
 * check-innovaciones-navegador.mjs — comportamiento REAL en navegador de las innovaciones de la ficha
 * (InnovacionesGrilla, opción B del mockup 2026-10-20-innovaciones). Complementa a check-innovaciones-grilla.mjs
 * (lógica pura): acá se prueba lo que sólo existe con layout, hover, foco, toque y scroll.
 *
 * Qué prueba, con datos FALSOS de 4, 5, 13 y 20 innovaciones (una sin descripción, una con sólo espacios,
 * un título largo), con la API pública mockeada por intercepción (no pega a ningún servidor):
 *   · 4 o menos = lista de siempre; 5 o más = grilla.
 *   · 1440 con mouse: hover y foco de teclado abren, Escape cierra, una sola abierta, el layout no se mueve.
 *   · 390 táctil: tocar abre/cierra, una sola abierta, puntos y «n / N» sincronizados al deslizar, 13 → 3 páginas,
 *     Tab hacia una ficha de OTRA página no cierra el globo recién abierto.
 *   · Ficha sin descripción (o de sólo espacios) = sin botón, no abre.
 *   · Tablet táctil ≥768px: el texto no dice «mouse». Idioma EN: textos en inglés.
 *   · Visual: puntos inactivos ≥3:1 sobre el fondo, tipografía 12/13px, colores del globo desde variables de :root.
 *
 * Usa `puppeteer` (ya devDependency del repo, como check-media / check-volver-categoria) con el Chrome instalado.
 * Levanta su propio `vite` en KT_PORT (por defecto 5192) salvo que se pase KT_BASE con uno ya corriendo.
 * Sale con código ≠ 0 si algo falla.
 *
 *   node scripts/check-innovaciones-navegador.mjs
 *   KT_BASE=http://127.0.0.1:5173 node scripts/check-innovaciones-navegador.mjs
 */
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

const PORT = process.env.KT_PORT || '5192'
const BASE = (process.env.KT_BASE || `http://127.0.0.1:${PORT}`).replace(/\/$/, '')

// ---- datos falsos ----------------------------------------------------------------------------------------
const LARGO = 'SISTEMA DE REFRIGERACIÓN ACTIVA CON DISIPADOR DE ALUMINIO Y VENTILACIÓN SILENCIOSA'
function innovaciones(n) {
  return Array.from({ length: n }, (_, i) => ({
    nombre: i === 1 ? LARGO : `INNOVACIÓN ${i + 1}`,
    descripcion: i === 2 ? '' : i === 3 ? '   ' : `Descripción de la innovación ${i + 1}.`,
    media_url: null,
  }))
}
const producto = (n) => ({
  id: `p${n}`, slug: `p${n}`, nombre: `PRODUCTO ${n}`, categoria: 'Efectos', moneda: 'ARS', precio: null,
  descripcion: 'Producto de prueba.', img_url: '', imagenes: [], innovaciones: innovaciones(n), variantes: [], specs: [], docs: [], media: [],
})
const PRODUCTOS = [4, 5, 13, 20].map(producto)

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
async function abrir(browser, { slug, viewport, lang }) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  if (lang) await page.evaluateOnNewDocument((l) => window.localStorage.setItem('kolortec-lang', l), lang)
  await page.setRequestInterception(true)
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
  page.on('request', (req) => {
    const url = req.url()
    if (!/\/api\/public\//.test(url)) return req.continue()
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { ...cors, 'access-control-allow-headers': req.headers()['access-control-request-headers'] || '' } })
    const body = /\/public\/productos(\?.*)?$/.test(url) ? JSON.stringify(PRODUCTOS) : '[]'
    return req.respond({ status: 200, contentType: 'application/json', headers: cors, body })
  })
  await page.goto(`${BASE}/producto/${slug}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('.kt-detail-name'), { timeout: 30000 })
  await page.addStyleTag({ content: '.kt-reveal-item{opacity:1!important;transform:none!important;transition:none!important}' })
  // el botón flotante de WhatsApp no es parte de lo que se prueba y tapa fichas en el celular
  await page.evaluate(() => document.querySelectorAll('body *').forEach((e) => {
    if (getComputedStyle(e).position !== 'fixed') return
    const r = e.getBoundingClientRect()
    if (r.width < 120 && r.height < 120 && r.right > innerWidth - 150 && r.bottom > innerHeight - 150) e.style.display = 'none'
  }))
  await espera(400)
  return page
}
const expandidas = (page) => page.$$eval('button.kt-innov-ficha', (bs) => bs.map((b, i) => [i, b.getAttribute('aria-expanded')]).filter(([, v]) => v === 'true').map(([i]) => i))
const globoVisible = (page) => page.$eval('.kt-innov-globo', (g) => !g.hidden)
const globoTexto = (page) => page.$eval('.kt-innov-globo', (g) => g.textContent)
const contador = (page) => page.$eval('.kt-innov-pag', (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null)
const hint = (page) => page.$eval('.kt-innov-hint', (e) => e.innerText)
const irAPagina = async (page, n) => {
  await page.$eval('.kt-innov-pista', (p, k) => p.scrollTo({ left: p.children[k].offsetLeft - p.children[0].offsetLeft, behavior: 'instant' }), n)
  await espera(500)
}
const COMPU = { width: 1440, height: 900 }
const CELU = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const TABLET = { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

// ---- escenarios ------------------------------------------------------------------------------------------
async function main() {
  await levantar()
  const browser = await puppeteer.launch({ channel: 'chrome', headless: true })
  try {
    console.log('4 innovaciones → lista de siempre')
    let page = await abrir(browser, { slug: 'p4', viewport: COMPU })
    ok((await page.$('.kt-innov')) === null, 'no hay grilla')
    ok((await page.$$('.kt-innov-ficha')).length === 0, 'no hay fichas de grilla')
    ok(await page.evaluate(() => /Descripción de la innovación 2./i.test(document.body.innerText) && /Descripción de la innovación 1./i.test(document.body.innerText)), "la lista muestra las descripciones completas")
    await page.close()

    console.log('5 innovaciones → grilla (1 sola página, sin puntos)')
    page = await abrir(browser, { slug: 'p5', viewport: CELU })
    ok((await page.$$('.kt-innov-ficha')).length === 5, 'grilla de 5 fichas')
    ok((await page.$('.kt-innov-nav')) === null, 'una sola página: sin puntos')
    await page.close()

    console.log('20 innovaciones · 1440 con mouse')
    page = await abrir(browser, { slug: 'p20', viewport: COMPU })
    ok((await page.$$('.kt-innov-ficha')).length === 20, '20 fichas')
    ok((await page.$$('button.kt-innov-ficha')).length === 18, 'la ficha sin descripción y la de sólo espacios no son botón (18 botones)')
    ok(/mouse/.test(await hint(page)) && /20 innovaciones/.test(await hint(page)), 'texto: «20 innovaciones · pasá el mouse…»')
    ok(await page.$eval('.kt-innov-nav', (n) => getComputedStyle(n).display === 'none'), 'sin puntos en compu')
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.kt-innov-pista')).gridTemplateColumns.split(' ').length >= 2), 'grilla de 2+ columnas')
    ok(await page.$eval('.kt-innov-pista', (p) => [...p.querySelectorAll('.kt-innov-ficha')].every((f) => f.scrollWidth <= f.clientWidth + 1)), 'el título largo no desborda su ficha')
    const alto0 = await page.$eval('.kt-innov', (r) => r.getBoundingClientRect().height)
    const botones = await page.$$('button.kt-innov-ficha')
    await botones[2].hover() // idx 2 de botones = 5.ª ficha (las dos sin descripción son la 3.ª y la 4.ª)
    await espera(200)
    ok((await expandidas(page)).join() === '2' && await globoVisible(page), 'hover abre su explicación (una sola abierta)')
    ok(/Descripción de la innovación 5\./.test(await globoTexto(page)), 'el globo trae la descripción de la ficha')
    ok(await page.$eval('.kt-innov-globo', (g) => g.getAttribute('role') === 'tooltip' && g.id === document.querySelectorAll('button.kt-innov-ficha')[2].getAttribute('aria-controls')), 'role=tooltip y aria-controls apunta al globo')
    ok(Math.abs(alto0 - await page.$eval('.kt-innov', (r) => r.getBoundingClientRect().height)) < 1, 'abrir el globo no mueve el layout')
    await botones[3].hover(); await espera(200)
    ok((await expandidas(page)).join() === '3', 'pasar a otra ficha: sólo queda abierta la nueva')
    await page.mouse.move(5, 5); await espera(200)
    ok((await expandidas(page)).length === 0 && !(await globoVisible(page)), 'sacar el mouse cierra')
    await page.keyboard.press('Shift')
    await page.$eval('button.kt-innov-ficha', (b) => b.focus()); await espera(200)
    ok((await expandidas(page)).join() === '0' && await globoVisible(page), 'foco de teclado abre')
    await page.keyboard.press('Escape'); await espera(150)
    ok(!(await globoVisible(page)) && (await expandidas(page)).length === 0, 'Escape cierra')
    await page.keyboard.press('Tab'); await espera(200)
    ok((await expandidas(page)).join() === '1', 'Tab pasa a la siguiente ficha y abre sólo esa')
    // visual
    const v = await page.evaluate(() => {
      const f = getComputedStyle(document.querySelector('.kt-innov-ficha'))
      const g = getComputedStyle(document.querySelector('.kt-innov-globo'))
      return { ficha: f.fontSize, globo: g.fontSize, globoBg: g.backgroundColor, varGlobo: getComputedStyle(document.documentElement).getPropertyValue('--innov-globo-bg').trim() }
    })
    ok(['12px', '13px'].includes(v.ficha) && ['12px', '13px'].includes(v.globo), 'tipografía de fichas y globo en 12/13px', JSON.stringify(v))
    ok(v.varGlobo === '#1b1b1b' && v.globoBg === 'rgb(27, 27, 27)', 'el fondo del globo sale de la variable --innov-globo-bg', JSON.stringify(v))
    await page.close()

    console.log('13 innovaciones · 390 táctil')
    page = await abrir(browser, { slug: 'p13', viewport: CELU })
    ok(/deslizá/.test(await hint(page)) && /13 innovaciones/.test(await hint(page)), 'texto: «13 innovaciones · deslizá para ver más · tocá una…»')
    ok((await page.$$('.kt-innov-punto')).length === 3, '13 → 3 páginas (3 puntos)')
    ok((await contador(page)) === '1 / 3', 'contador «1 / 3»')
    ok(await page.$eval('.kt-innov-pista', (p) => p.getAttribute('aria-roledescription') === 'carrusel'), 'aria-roledescription="carrusel"')
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'la página no scrollea de costado')
    const pagina1 = await page.$$('.kt-innov-pagina:nth-child(1) .kt-innov-ficha')
    ok(pagina1.length === 6, 'página 1 con 6 fichas')
    const bots = await page.$$('button.kt-innov-ficha')
    await bots[0].tap(); await espera(200)
    ok((await expandidas(page)).join() === '0' && await globoVisible(page), 'tocar abre')
    await bots[1].tap(); await espera(200)
    ok((await expandidas(page)).join() === '1', 'tocar otra: una sola abierta')
    await bots[1].tap(); await espera(200)
    ok((await expandidas(page)).length === 0 && !(await globoVisible(page)), 'tocar de nuevo cierra (toggle)')
    await pagina1[2].tap(); await pagina1[3].tap(); await espera(200)
    ok((await expandidas(page)).length === 0, 'tocar la ficha sin descripción / de sólo espacios no abre nada')
    await bots[0].tap(); await irAPagina(page, 1)
    ok((await contador(page)) === '2 / 3', 'deslizar a la página 2 → «2 / 3»')
    ok((await expandidas(page)).length === 0, 'cambiar de página cierra el globo')
    ok(await page.$$eval('.kt-innov-punto', (ps) => ps.map((p) => p.getAttribute('aria-current')).join()) === 'false,true,false', 'el punto activo sigue al scroll')
    await irAPagina(page, 2)
    ok((await contador(page)) === '3 / 3', 'última página → «3 / 3»')
    await (await page.$$('.kt-innov-punto'))[0].tap(); await espera(900)
    ok((await contador(page)) === '1 / 3', 'tocar el punto 1 lleva a la página 1')
    // REG-003: Tab hacia una ficha de otra página desplaza la pista y NO debe cerrar el globo recién abierto
    await page.keyboard.press('Shift')
    await page.evaluate(() => { const fs = document.querySelectorAll('.kt-innov-pagina:nth-child(1) button.kt-innov-ficha'); fs[fs.length - 1].focus() })
    await page.keyboard.press('Tab'); await espera(1000)
    ok((await contador(page)) === '2 / 3', 'Tab a una ficha de la página 2 desplaza el carrusel')
    ok((await expandidas(page)).length === 1 && await globoVisible(page), 'ese scroll no cierra el globo recién abierto')
    ok(await page.$eval('.kt-innov-punto', (p) => getComputedStyle(p, '::before').backgroundColor) !== null, 'punto con color')
    const contraste = await page.evaluate(() => {
      const lum = (rgb) => {
        const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map((x) => { const c = Number(x) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const inactivo = getComputedStyle(document.querySelectorAll('.kt-innov-punto')[2], '::before').backgroundColor
      const fondo = getComputedStyle(document.body).backgroundColor
      const [a, b] = [lum(inactivo), lum(fondo.startsWith('rgba(0, 0, 0, 0)') ? 'rgb(5, 5, 5)' : fondo)].sort((x, y) => y - x)
      return (a + 0.05) / (b + 0.05)
    })
    ok(contraste >= 3, 'punto inactivo con contraste ≥ 3:1 sobre el fondo', contraste.toFixed(2))
    await page.close()

    console.log('Tablet táctil 820px')
    page = await abrir(browser, { slug: 'p13', viewport: TABLET })
    const hTab = await hint(page)
    ok(!/mouse/.test(hTab) && /tocá/.test(hTab) && !/deslizá/.test(hTab), 'grilla sin carrusel y sin «pasá el mouse»', hTab)
    await page.close()

    console.log('Idioma EN')
    page = await abrir(browser, { slug: 'p13', viewport: COMPU, lang: 'en' })
    ok(/13 innovations · hover to see the detail/.test(await hint(page)), 'compu: texto en inglés')
    await page.close()
    page = await abrir(browser, { slug: 'p13', viewport: CELU, lang: 'en' })
    ok(/swipe for more · tap one/.test(await hint(page)), 'celular: texto en inglés')
    ok(await page.$eval('.kt-innov-punto', (p) => /Go to page 1 of 3/.test(p.getAttribute('aria-label'))), 'puntos con aria-label en inglés')
    await page.close()
  } finally {
    await browser.close()
  }
}

try {
  await main()
} catch (e) {
  fallas.push('excepción: ' + (e?.stack || e))
  console.log('\n  ✘ EXCEPCIÓN', e?.stack || e)
} finally {
  if (servidor) servidor.kill()
}
const bien = total - fallas.filter((f) => !f.startsWith('excepción')).length
console.log(`\n${bien}/${total} OK${fallas.length ? ' — FALLÓ: ' + fallas.join(' | ') : ''}`)
process.exit(fallas.length ? 1 : 0)
