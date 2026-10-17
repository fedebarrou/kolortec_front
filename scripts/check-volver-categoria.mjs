/**
 * check-volver-categoria.mjs — «desde un producto, atrás vuelve a la categoría».
 *
 * Bug (17-oct): en una ficha, el botón «volver» del sitio iba siempre a /products
 * (un nivel más atrás que la categoría) y el «atrás» del navegador volvía a la
 * categoría pero arriba de todo y sin la etiqueta que habías elegido.
 *
 * Corre contra un `vite` levantado (KT_BASE, por defecto http://127.0.0.1:5173) con
 * la API PÚBLICA mockeada por intercepción: no depende de que el tiendita local
 * tenga cargada la cuenta de kolortec, ni pega a producción.
 *
 *   npm run dev            (en otra terminal)
 *   node scripts/check-volver-categoria.mjs
 *   KT_BASE=http://127.0.0.1:5288 node scripts/check-volver-categoria.mjs
 */
import puppeteer from 'puppeteer'

const BASE = (process.env.KT_BASE || 'http://127.0.0.1:5173').replace(/\/$/, '')

const CATEGORIAS = [
  { id: 'c1', slug: 'linternas', nombre: 'Linternas', orden: 0, image_url: null },
  { id: 'c2', slug: 'faros', nombre: 'Faros', orden: 1, image_url: null },
]
const PRODUCTOS = Array.from({ length: 16 }, (_, i) => ({
  id: `p${i}`,
  slug: `prod-${i}`,
  nombre: `Producto ${i}`,
  nombre_visible: `Producto ${i}`,
  categoria: i < 12 ? 'linternas' : 'faros',
  badges: [{ label: i % 2 ? 'Rental' : 'Ready to work', color: null }],
  media: [],
  variantes: [],
}))

const HOST_PROD = /soytiendita\.store|tiendita\.com\.ar/
const prodLeak = []
const fallas = []
const ok = (cond, msg) => {
  console.log(`${cond ? 'OK  ' : 'FALLA'} ${msg}`)
  if (!cond) fallas.push(msg)
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const ruta = (page) => {
  const u = new URL(page.url())
  return u.pathname + u.search
}

async function nuevaPagina(browser) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = req.url()
    // Guarda contra producción (REG-002): el vite de :5288 apunta a api.soytiendita.store. Lo que NO sea la API
    // pública interceptada y vaya a esos hosts se ABORTA y se cuenta; con PROD_LEAK > 0 el check falla.
    // El traductor (translate.soytiendita.store) también es de producción: se contesta 503 desde acá y la ficha
    // cae a su texto original. No sale nada hacia afuera.
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
    if (pathname.endsWith('/public/categorias')) body = CATEGORIAS
    if (pathname.endsWith('/public/productos')) body = PRODUCTOS
    if (body === null) return req.respond({ status: 404, headers, contentType: 'application/json', body: '{}' })
    return req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) })
  })
  return page
}

async function clickPor(page, selector) {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.$eval(selector, (el) => el.click())
}

async function clickBotonTexto(page, texto) {
  await page.waitForFunction(
    (t) => [...document.querySelectorAll('button[aria-pressed]')].some((b) => b.textContent.trim().toLowerCase() === t),
    { timeout: 15000 },
    texto,
  )
  await page.evaluate((t) => {
    ;[...document.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.trim().toLowerCase() === t).click()
  }, texto)
}

/** Inicio → catálogo → categoría → etiqueta Rental → scroll → producto. */
async function hastaLaFicha(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
  await clickPor(page, 'a[href="/products"]')
  await clickPor(page, 'a[href="/products/linternas"]')
  await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
  await clickBotonTexto(page, 'rental')
  await pausa(300)
  await page.evaluate(() => window.scrollTo(0, 700))
  await pausa(400)
  const y = await page.evaluate(() => window.scrollY)
  const desde = ruta(page)
  // Un producto que siga en pantalla con el filtro puesto (los impares son Rental).
  await clickPor(page, 'a[href="/producto/prod-5"]')
  await page.waitForFunction(() => location.pathname.startsWith('/producto/'), { timeout: 15000 })
  await pausa(800)
  return { desde, y }
}

async function etiquetaActiva(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent.trim().toLowerCase()),
  )
}

const browser = await puppeteer.launch({ headless: true })
try {
  // 1) «Atrás» del navegador.
  {
    const page = await nuevaPagina(browser)
    const { desde, y } = await hastaLaFicha(page)
    ok(desde === '/products/linternas?etiqueta=rental', `la etiqueta vive en la URL (${desde})`)
    await page.goBack()
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(600)
    const yAtras = await page.evaluate(() => window.scrollY)
    ok(ruta(page) === desde, `atrás del navegador vuelve a ${desde} (quedó en ${ruta(page)})`)
    ok(Math.abs(yAtras - y) <= 4, `atrás del navegador restaura el scroll (${y} → ${yAtras})`)
    ok((await etiquetaActiva(page)).includes('rental'), 'atrás del navegador mantiene la etiqueta Rental marcada')
    await page.close()
  }

  // 2) Botón «volver» del sitio, habiendo navegado desde la categoría.
  {
    const page = await nuevaPagina(browser)
    const { desde, y } = await hastaLaFicha(page)
    await clickPor(page, 'button.kt-detail-back')
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(600)
    const yVolver = await page.evaluate(() => window.scrollY)
    ok(ruta(page) === desde, `«volver» del sitio vuelve a ${desde} (quedó en ${ruta(page)})`)
    ok(Math.abs(yVolver - y) <= 4, `«volver» del sitio restaura el scroll (${y} → ${yVolver})`)
    await page.close()
  }

  // 3) Entrada directa a la ficha (link compartido): «volver» cae a SU categoría.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/producto/prod-13`, { waitUntil: 'networkidle2' })
    await clickPor(page, 'button.kt-detail-back')
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/faros', `entrada directa: «volver» va a la categoría del producto (${ruta(page)})`)
    await page.close()
  }

  // 4) Catálogo con filtros: atrás desde una ficha conserva los filtros.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/products?etiqueta=rental`, { waitUntil: 'networkidle2' })
    await clickPor(page, 'a[href="/producto/prod-3"]')
    await page.waitForFunction(() => location.pathname.startsWith('/producto/'), { timeout: 15000 })
    await page.goBack()
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    ok(ruta(page) === '/products?etiqueta=rental', `catálogo: atrás conserva el filtro (${ruta(page)})`)
    const visibles = await page.$$eval('a[href^="/producto/"]', (as) => as.length)
    ok(visibles === 8, `catálogo: muestra los 8 productos Rental (${visibles})`)
    await page.close()
  }

  // 5) Los clics de filtro NO apilan historial: Rental → Todos → Rental, ficha, dos «atrás» ⇒ /products.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await clickPor(page, 'a[href="/products"]')
    await clickPor(page, 'a[href="/products/linternas"]')
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    for (const t of ['rental', 'todos', 'rental']) {
      await clickBotonTexto(page, t)
      await pausa(250)
    }
    await clickPor(page, 'a[href="/producto/prod-5"]')
    await page.waitForFunction(() => location.pathname.startsWith('/producto/'), { timeout: 15000 })
    await page.goBack()
    await page.waitForFunction(() => location.pathname === '/products/linternas', { timeout: 15000 })
    await page.goBack()
    await pausa(600)
    ok(ruta(page) === '/products', `los filtros no apilan historial: el segundo «atrás» queda en /products (${ruta(page)})`)
    await page.close()
  }

  // 6) Una etiqueta que no existe en la categoría cae a «Todos» (no deja la lista vacía sin nada marcado).
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/products/linternas?etiqueta=xyz`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    ok((await etiquetaActiva(page)).includes('todos'), 'etiqueta inexistente: queda marcado «Todos» y se ve la categoría entera')
    await page.close()
  }
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
