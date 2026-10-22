/**
 * check-volver-categoria.mjs — «desde un producto, atrás vuelve a la categoría».
 *
 * Bug (17-oct): en una ficha, el botón «volver» del sitio iba siempre a /products
 * (un nivel más atrás que la categoría) y el «atrás» del navegador volvía a la
 * categoría pero arriba de todo y sin la etiqueta que habías elegido.
 *
 * 21-oct (regla de Fedev: «estamos en un cabezal móvil, quiero que al volver vaya a la categoría»): la flecha
 * «volver» SIEMPRE lleva a la categoría del producto. Sólo si la página anterior es justo ESA categoría
 * (`state.desde === 'categoria'` y el mismo slug) vuelve por el historial (`navigate(-1)`) y conserva ?etiqueta= y
 * scroll (casos 2 y 10b). Desde el landing, el buscador, el catálogo, otra ficha o un link directo navega a la
 * categoría (casos 3 y 7-11). El botón atrás del NAVEGADOR no se toca (casos 1, 4, 5 y 7).
 *
 * Corre contra un `vite` levantado (KT_BASE, por defecto http://127.0.0.1:5173) con
 * la API PÚBLICA mockeada por intercepción: no depende de que el tiendita local
 * tenga cargada la cuenta de kolortec, ni pega a producción.
 *
 *   npm run dev            (en otra terminal)
 *   node scripts/check-volver-categoria.mjs
 *   KT_BASE=http://127.0.0.1:5288 node scripts/check-volver-categoria.mjs
 *
 * Cómo levantar el vite (REG-005): con el hostname de QA, NO con el .env de producción. La API pública se mockea por intercepción
 * y estas dos variables hacen que el front pida a un host que no existe, así que nada puede salir hacia producción:
 *   VITE_API_BASE_URL=http://api.qa.invalid/api VITE_TIENDITA_ACCOUNT_HOST=kolortec.qa.invalid \
 *     npx vite --host 127.0.0.1 --port <puerto> --strictPort
 */
import puppeteer from 'puppeteer'
import { forma } from './forma-no-encontrada.mjs'

const BASE = (process.env.KT_BASE || 'http://127.0.0.1:5173').replace(/\/$/, '')
// Ancho del viewport: 1440 por defecto; KT_ANCHO=390 repite todo el recorrido en celular.
const ANCHO = Number(process.env.KT_ANCHO) || 1440

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
// REG-002 (5.ª vuelta): un producto cuya categoría NO está en /public/categorias (borrada o nunca publicada).
PRODUCTOS.push({
  id: 'huerfano', slug: 'huerfano', nombre: 'Producto huérfano', nombre_visible: 'Producto huérfano',
  categoria: 'fantasma', badges: [], media: [], variantes: [],
})

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

/**
 * `demoraCats`: ms que tarda en contestar /public/categorias (0 = enseguida). `catsFallo`: contesta 500 (la API de categorías
 * caída. Con las dos juntas gana el fallo. `productosFallo`: /public/productos contesta 500 (la API de productos caída); se baja con
 * `page.ctl.productosFallo = false` para probar «Reintentar».
 */
async function nuevaPagina(browser, { demoraCats = 0, catsFallo = false, productosFallo = false } = {}) {
  const page = await browser.newPage()
  page.ctl = { productosFallo }
  await page.setViewport({ width: ANCHO, height: ANCHO < 700 ? 844 : 900 })
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
    if (pathname.endsWith('/public/categorias')) {
      if (catsFallo) return req.respond({ status: 500, headers, contentType: 'application/json', body: '{}' })
      if (demoraCats > 0) return void setTimeout(() => { req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(CATEGORIAS) }).catch(() => {}) }, demoraCats)
      body = CATEGORIAS
    }
    if (pathname.endsWith('/public/productos')) {
      if (page.ctl.productosFallo) return req.respond({ status: 500, headers, contentType: 'application/json', body: '{}' })
      body = PRODUCTOS
    }
    if (body === null) return req.respond({ status: 404, headers, contentType: 'application/json', body: '{}' })
    return req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) })
  })
  return page
}

async function clickPor(page, selector) {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.$eval(selector, (el) => el.click())
}

/**
 * Clic REAL (mouse en el centro) sobre la flecha «Volver» VISIBLE de la ficha. Hay dos: la de escritorio (`.kt-detail-back`, en la
 * barra fija) y la de celular (en `nav.sticky`, sólo < 641px); la otra está oculta con display:none y un `el.click()` sobre ella
 * pasaba aunque ningún usuario pudiera tocarla. Devuelve cuál se tocó.
 */
async function clickFlecha(page, { estable = true } = {}) {
  await page.waitForFunction(() => [...document.querySelectorAll('button[aria-label="Volver"]')].some((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 }), { timeout: 15000 })
  // La barra entra con una animación: se espera a que la flecha deje de moverse antes del clic (si no, el mouse cae donde YA no está).
  const medir = () => page.evaluate(() => {
    const b = [...document.querySelectorAll('button[aria-label="Volver"]')].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    const r = b.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, cual: b.classList.contains('kt-detail-back') ? 'escritorio (.kt-detail-back)' : 'celular (nav.sticky)' }
  })
  if (estable) await pausa(400)
  let info = await medir()
  for (let i = 0; estable && i < 20; i += 1) {
    await pausa(100)
    const otra = await medir()
    const quieta = Math.abs(otra.x - info.x) < 0.5 && Math.abs(otra.y - info.y) < 0.5
    info = otra
    if (quieta) break
  }
  await page.mouse.click(info.x, info.y)
  return info.cual
}

/** Estado de la flecha visible: si está deshabilitada y con aria-busy. */
const estadoFlecha = (page) => page.evaluate(() => {
  const b = [...document.querySelectorAll('button[aria-label="Volver"]')].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  return b ? { disabled: b.disabled, busy: b.getAttribute('aria-busy') } : null
})
const idxHistoria = (page) => page.evaluate(() => window.history.state?.idx ?? 0)

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

let formaCategoria = null // la forma de «Categoría no encontrada», medida en el caso 18 y reusada en el 19
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
    await clickFlecha(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(600)
    const yVolver = await page.evaluate(() => window.scrollY)
    ok(ruta(page) === desde, `«volver» del sitio vuelve a ${desde} (quedó en ${ruta(page)})`)
    ok(Math.abs(yVolver - y) <= 4, `«volver» del sitio restaura el scroll (${y} → ${yVolver})`)
    await page.close()
  }

  // 3) LINK DIRECTO a la ficha (link compartido): «volver» cae a SU categoría.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/producto/prod-13`, { waitUntil: 'networkidle2' })
    await clickFlecha(page)
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

  // 7) LANDING → destacado → flecha «volver» ⇒ la categoría del producto (no el landing). Bug 21-oct: desde el
  //    landing `history.state.idx > 0`, así que `navigate(-1)` dejaba al visitante de vuelta en el landing.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await clickPor(page, '#products a[href="/producto/prod-2"]')
    await page.waitForFunction(() => location.pathname === '/producto/prod-2', { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/linternas', `landing → destacado → «volver» va a la categoría del producto (${ruta(page)})`)
    // El botón atrás del NAVEGADOR no se toca: sigue siendo el historial, así que desde la ficha vuelve al landing.
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await clickPor(page, '#products a[href="/producto/prod-2"]')
    await page.waitForFunction(() => location.pathname === '/producto/prod-2', { timeout: 15000 })
    await page.goBack()
    await page.waitForFunction(() => location.pathname === '/', { timeout: 15000 })
    ok(ruta(page) === '/', `landing → destacado → «atrás» del NAVEGADOR sigue siendo el historial (${ruta(page)})`)
    await page.close()
  }

  // 8) BUSCADOR (/products?q=) → ficha → flecha «volver» ⇒ la categoría del producto (no el buscador).
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/products?q=${encodeURIComponent('producto 1')}`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await clickPor(page, 'a[href="/producto/prod-12"]')
    await page.waitForFunction(() => location.pathname === '/producto/prod-12', { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/faros', `buscador → ficha → «volver» va a la categoría del producto (${ruta(page)})`)
    await page.close()
  }

  // 9) FICHA → relacionado → flecha «volver» ⇒ la categoría del relacionado (no la ficha anterior). La flecha de la
  //    primera ficha (que vino del landing) también va a su categoría.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await clickPor(page, '#products a[href="/producto/prod-5"]')
    await page.waitForFunction(() => location.pathname === '/producto/prod-5', { timeout: 15000 })
    await pausa(800)
    // Primer relacionado real (la copia no aria-hidden del carrusel) distinto de la ficha actual.
    await page.waitForSelector('.kt-marquee-item-product:not([aria-hidden="true"]) a[href^="/producto/"]', { timeout: 15000 })
    const rel = await page.$eval('.kt-marquee-item-product:not([aria-hidden="true"]) a[href^="/producto/"]', (a) => a.getAttribute('href'))
    await page.$eval('.kt-marquee-item-product:not([aria-hidden="true"]) a[href^="/producto/"]', (a) => a.click())
    await page.waitForFunction((r) => location.pathname === r, { timeout: 15000 }, rel)
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    const catRel = PRODUCTOS.find((p) => `/producto/${p.slug}` === rel)?.categoria
    ok(catRel && ruta(page) === `/products/${catRel}`, `ficha → relacionado (${rel}) → «volver» va a la categoría del relacionado (${ruta(page)})`)
    // El botón atrás del NAVEGADOR sigue siendo el historial: vuelve a la ficha anterior.
    await page.goBack()
    await page.goBack()
    await page.waitForFunction(() => location.pathname === '/producto/prod-5', { timeout: 15000 })
    ok(ruta(page) === '/producto/prod-5', `…y «atrás» del NAVEGADOR sigue volviendo a la ficha anterior (${ruta(page)})`)
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/linternas', `…y la flecha de la primera ficha (que vino del landing) va a su categoría (${ruta(page)})`)
    await page.close()
  }

  // 10) Buscador del HEADER (vive en todas las páginas): «volver» va a la categoría del producto; si el buscador se usó
  //     parado en ESA categoría (con su filtro), vuelve por el historial y la conserva tal cual.
  for (const [inicio, esperado, nombre] of [
    ['/', '/products/linternas', 'desde el landing → categoría del producto'],
    ['/products?etiqueta=rental', '/products/linternas', 'desde el catálogo → categoría del producto'],
    ['/products/linternas?etiqueta=rental', '/products/linternas?etiqueta=rental', 'desde su categoría con filtro → la conserva'],
    ['/products/faros', '/products/linternas', 'desde OTRA categoría → categoría del producto'],
  ]) {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}${inicio}`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('input[role="combobox"]', { timeout: 15000 })
    const hayCombobox = await page.$eval('input[role="combobox"]', (el) => el.getClientRects().length > 0)
    let esperadoAqui = esperado
    if (hayCombobox) {
      await page.type('input[role="combobox"]', 'Producto 5')
      await page.waitForSelector('#navPredictiveResults [role="option"]', { timeout: 15000 })
      await page.$eval('#navPredictiveResults [role="option"]', (el) => el.click())
    } else {
      // Celular (KT_ANCHO=390): el buscador vive en el menú de la hamburguesa y no predice; Enter lleva a /products?q=
      // y de ahí se toca la ficha. La página anterior es el buscador, no la categoría: «volver» va a la categoría del producto.
      esperadoAqui = '/products/linternas'
      await clickPor(page, 'button[aria-label="Abrir menú"]')
      await page.waitForSelector('input[type="search"]', { visible: true, timeout: 15000 })
      await page.type('input[type="search"]', 'Producto 5')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => location.pathname === '/products' && location.search.includes('q='), { timeout: 15000 })
      await pausa(800)
      await clickPor(page, 'a[href="/producto/prod-5"]')
    }
    await page.waitForFunction(() => location.pathname.startsWith('/producto/'), { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === esperadoAqui, `buscador del header, ${nombre} (${ruta(page)})`)
    await page.close()
  }

  // 11) CATÁLOGO con filtro (/products?etiqueta=) → ficha → flecha «volver» ⇒ la categoría del producto (no el catálogo).
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/products?etiqueta=rental`, { waitUntil: 'networkidle2' })
    await clickPor(page, 'a[href="/producto/prod-3"]')
    await page.waitForFunction(() => location.pathname === '/producto/prod-3', { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/linternas', `catálogo con filtro → ficha → «volver» va a la categoría del producto (${ruta(page)})`)
    await page.close()
  }

  // 12) REG-002: la categoría del producto no existe en /public/categorias ⇒ «volver» va a /products, no a una página
  //     «Categoría no encontrada» (/products/fantasma).
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/producto/huerfano`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products', `categoría inexistente: «volver» va a /products, no a /products/fantasma (${ruta(page)})`)
    await page.close()
  }

  // 13) REG-003: /public/categorias responde 500 ⇒ no se puede afirmar que la categoría no exista: «volver» va a la categoría
  //     del producto (/products/linternas), NO a /products.
  {
    const page = await nuevaPagina(browser, { catsFallo: true })
    await page.goto(`${BASE}/producto/prod-5`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    await pausa(800)
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    ok(ruta(page) === '/products/linternas', `API de categorías caída (500): «volver» va a la categoría del producto (${ruta(page)})`)
    await page.close()
  }

  // 14) REG-004: tocan la flecha ANTES de que lleguen las categorías (llegan a 1,2 s): en un producto huérfano se ESPERA la lista
  //     (tope 1,5 s) y va a /products, no a /products/fantasma.
  {
    const page = await nuevaPagina(browser, { demoraCats: 1200 })
    await page.goto(`${BASE}/producto/huerfano`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    const t0 = Date.now()
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    const espera = Date.now() - t0
    ok(ruta(page) === '/products', `flecha antes de que lleguen las categorías (1,2 s): espera la lista y va a /products, no a /products/fantasma (${ruta(page)}, ${espera} ms)`)
    await page.close()
  }

  // 15) REG-004: las categorías tardan 4 s (más que el tope de 1,5 s): la flecha NO se queda colgada; sigue con la categoría
  //     del producto.
  {
    const page = await nuevaPagina(browser, { demoraCats: 4000 })
    await page.goto(`${BASE}/producto/huerfano`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    const t0 = Date.now()
    await clickFlecha(page)
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    const espera = Date.now() - t0
    ok(ruta(page) === '/products/fantasma', `categorías a 4 s: pasado el tope sigue con la categoría del producto (${ruta(page)})`)
    ok(espera >= 1200 && espera < 3500, `categorías a 4 s: la flecha espera sólo el tope (${espera} ms, entre 1,2 y 3,5 s)`)
    await page.close()
  }

  // 16) REG-001 (7.ª vuelta): DOBLE TOQUE durante la espera de las categorías (llegan a 1,2 s). Una sola navegación (idx 0 → 1, no 0 → 2),
  //     la flecha queda deshabilitada y con aria-busy mientras espera. Se prueba con la flecha visible de este viewport
  //     (1440: la de escritorio; 390: la de celular en nav.sticky).
  {
    const page = await nuevaPagina(browser, { demoraCats: 1200 })
    await page.goto(`${BASE}/producto/huerfano`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    const antes = await idxHistoria(page)
    const cual = await clickFlecha(page)
    await pausa(80)
    const durante = await estadoFlecha(page)
    await clickFlecha(page, { estable: false }) // segundo toque, ya con la espera en curso
    await page.waitForFunction(() => !location.pathname.startsWith('/producto/'), { timeout: 15000 })
    await pausa(600)
    const despues = await idxHistoria(page)
    ok(durante?.disabled === true && durante?.busy === 'true', `doble toque, flecha ${cual}: durante la espera está deshabilitada y con aria-busy (disabled ${durante?.disabled}, aria-busy ${durante?.busy})`)
    ok(ruta(page) === '/products' && despues - antes === 1, `doble toque, flecha ${cual}: UNA sola navegación (idx ${antes} → ${despues}) y va a /products (${ruta(page)})`)
    await page.close()
  }

  // 17) REG-002 (7.ª vuelta): tocan la flecha y, ANTES de que resuelva la espera, navegan a otro lado (el logo → /). El navigate pendiente
  //     NO corre después: se queda donde el usuario fue.
  {
    const page = await nuevaPagina(browser, { demoraCats: 1200 })
    await page.goto(`${BASE}/producto/huerfano`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 })
    const cual = await clickFlecha(page)
    await pausa(80)
    const logo = await page.evaluate(() => {
      const a = [...document.querySelectorAll('header a[href="/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      if (!a) return null
      const r = a.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    if (logo) await page.mouse.click(logo.x, logo.y)
    await page.waitForFunction(() => location.pathname === '/', { timeout: 15000 }).catch(() => {})
    await pausa(2200) // la espera (1 s) y el tope (1,5 s) ya vencieron
    ok(logo !== null && ruta(page) === '/', `navegar a otro lado durante la espera (flecha ${cual}): se queda en / y el navigate pendiente no corre (${ruta(page)})`)
    await page.close()
  }

  // 18) REG-001 (joan, 8.ª vuelta): un 404 REAL (la lista de productos llegó y el slug no está) es «Producto no encontrado»: la misma página
  //     «no encontrada» de categoría y línea (h1 grande, enlace amarillo a /products, robots noindex,follow), SIN Reintentar.
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/producto/no-existe`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /Producto no encontrado/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    await pausa(300)
    const info = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      const enlace = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/products' && /Volver/i.test(a.textContent))
      const probe = document.createElement('i'); probe.style.color = 'var(--primary)'; document.body.appendChild(probe)
      const primary = getComputedStyle(probe).color; probe.remove()
      return {
        h1: h1?.textContent ?? '', h1s: document.querySelectorAll('h1').length, fuente: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
        reintentar: [...document.querySelectorAll('button')].some((b) => /Reintentar/i.test(b.textContent)),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
        color: enlace ? getComputedStyle(enlace).color : '', primary, alto: Math.round(enlace?.getBoundingClientRect().height ?? 0),
        dicecaida: /No pudimos mostrar/i.test(document.body.innerText),
      }
    })
    ok(/Producto no encontrado/i.test(info.h1) && info.h1s === 1 && info.fuente >= 36, `404 real: «Producto no encontrado» como único h1 grande (${info.h1.trim()}, ${info.fuente}px)`)
    ok(!info.reintentar && !info.dicecaida, '404 real: no ofrece Reintentar ni dice «No pudimos mostrar» (no es una API caída)')
    ok(info.robots === 'noindex,follow', `404 real: robots «${info.robots}»`)
    ok(info.color === info.primary && info.alto >= 44, `404 real: «Volver a productos» amarillo (${info.color}) y de >= 44px (${info.alto}px)`)
    // VIS-035: la MISMA forma que «Categoría no encontrada» (se mide con forma(), la de check-filtros): título (tamaño, tipografía,
    // interlineado, posición y guía izquierda) y enlace «Volver» (posición, tamaño, color y peso).
    const prod = await forma(page)
    const pc = await nuevaPagina(browser)
    await pc.goto(`${BASE}/products/inexistente`, { waitUntil: 'networkidle2' })
    await pc.waitForFunction(() => /Categor[ií]a no encontrada/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    await pausa(400)
    formaCategoria = await forma(pc)
    await pc.close()
    const igual = ['top', 'izq', 'fuente', 'familia', 'interlineado', 'volverIzq', 'volverAlto', 'volverColor', 'volverPeso', 'cuerpoColor', 'fondo']
    const distintos = igual.filter((k) => prod[k] !== formaCategoria[k])
    ok(prod.hay && formaCategoria.hay && distintos.length === 0 && !prod.caja,
      `404 real: «Producto no encontrado» tiene la MISMA forma que «Categoría no encontrada» (título a ${prod.top}px/${formaCategoria.top}px, guía ${prod.izq}px, ${prod.fuente}; enlace ${prod.volverAlto}px ${prod.volverPeso}${distintos.length ? '; distintos: ' + distintos.join(', ') : ''})`)
    await page.close()
  }

  // 19) REG-001 (joan): la API de productos CAÍDA (500) NO es «no encontrado»: «No pudimos mostrar este producto» + Reintentar, y Reintentar
  //     vuelve a pedir y muestra la ficha.
  {
    const page = await nuevaPagina(browser, { productosFallo: true })
    await page.goto(`${BASE}/producto/prod-5`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos mostrar este producto/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    await pausa(300)
    const caida = await page.evaluate(() => ({
      dice: /No pudimos mostrar este producto/i.test(document.body.innerText),
      noEncontrado: /Producto no encontrado/i.test(document.body.innerText),
      reintentar: [...document.querySelectorAll('button')].some((b) => /Reintentar/i.test(b.textContent)),
    }))
    // VIS-033/035: el título de la API caída va a la MISMA escala que el «no encontrado» (en la ficha no hay dos escalas de h1).
    const fc = await forma(page)
    ok(fc.hay && formaCategoria && fc.fuente === formaCategoria.fuente && fc.familia === formaCategoria.familia && fc.interlineado === formaCategoria.interlineado,
      `API de productos caída: el h1 usa la misma escala que «no encontrado» (${fc.fuente} ${fc.interlineado} · ${formaCategoria?.fuente} ${formaCategoria?.interlineado})`)
    ok(caida.dice && caida.reintentar && !caida.noEncontrado, `API de productos caída: «No pudimos mostrar este producto» + Reintentar, y NO «Producto no encontrado» (${JSON.stringify(caida)})`)
    page.ctl.productosFallo = false
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Reintentar/i.test(b.textContent))?.click())
    await page.waitForSelector('button.kt-detail-back', { timeout: 15000 }).catch(() => {})
    ok((await page.$('button.kt-detail-back')) !== null, 'API de productos caída: Reintentar con la API de vuelta muestra la ficha')
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
