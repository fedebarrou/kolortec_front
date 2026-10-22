/**
 * check-filtros.mjs — buscador + filtros del catálogo (/products) y la página de línea (/linea/:slug), en navegador.
 *
 * 21-oct. Huecos que cierra:
 *   · Con `?q=` ShopPage ignoraba `categoria` y `etiqueta`, y no mostraba la barra de filtros: ahora la búsqueda se COMBINA
 *     con los filtros (AND) y la barra se ve.
 *   · La búsqueda mira también ETIQUETAS y CATEGORÍA, sin distinguir acentos ni mayúsculas («movil» encuentra «Móvil»).
 *   · `?etiqueta=xyz` / `?categoria=inventada` se ignoran (como CategoryPage), no dan «Sin coincidencias».
 *   · LinePage restaura el scroll al volver (POP) y no anuncia «0 items · Próximamente» mientras carga.
 *   · LinePage dibuja el esqueleto (8 celdas .animate-pulse) también mientras carga la línea, no una pantalla negra.
 *   · Con la API de productos caída (500) la búsqueda dice «No pudimos cargar los productos» y ofrece Reintentar,
 *     no «Sin resultados · 0 items».
 *   · Una búsqueda de puros símbolos (`%`, `"`, un emoji) no es una búsqueda: se ignora como si no hubiera `q`.
 *   · Un solo margen (40px) bajo el encabezado de /products con y sin búsqueda, y placeholder de la barra a >= 4,5:1.
 *   · CategoryPage empareja id y label de cada etiqueta juntos (no por índice de dos listas distintas).
 *
 * Corre contra un `vite` levantado (KT_BASE, por defecto http://127.0.0.1:5173) con la API PÚBLICA mockeada por
 * intercepción: no depende de la cuenta local ni pega a producción (PROD_LEAK > 0 = falla).
 *
 *   npm run dev            (en otra terminal)
 *   node scripts/check-filtros.mjs
 *   KT_BASE=http://127.0.0.1:5391 node scripts/check-filtros.mjs
 *
 * Cómo levantar el vite (REG-005): con el hostname de QA, NO con el .env de producción. La API pública se mockea por intercepción
 * y estas dos variables hacen que el front pida a un host que no existe, así que nada puede salir hacia producción:
 *   VITE_API_BASE_URL=http://api.qa.invalid/api VITE_TIENDITA_ACCOUNT_HOST=kolortec.qa.invalid \
 *     npx vite --host 127.0.0.1 --port <puerto> --strictPort
 */
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer'
import { forma } from './forma-no-encontrada.mjs'

const BASE = (process.env.KT_BASE || 'http://127.0.0.1:5173').replace(/\/$/, '')
// Ancho del viewport: 1440 por defecto; KT_ANCHO=390 repite todo el recorrido en celular.
const ANCHO = Number(process.env.KT_ANCHO) || 1440

const CATEGORIAS = [
  { id: 'c1', slug: 'cabezal-movil', nombre: 'Cabezal Móvil', orden: 0, image_url: null },
  { id: 'c2', slug: 'strobo', nombre: 'Strobo Blinder', orden: 1, image_url: null },
  { id: 'c3', slug: 'golden-line', nombre: 'Golden Line', orden: 2, image_url: null },
]
const prod = (slug, nombre, categoria, badges = [], extra = {}) => ({
  id: slug, slug, nombre, nombre_visible: nombre, categoria, badges: badges.map((label) => ({ label, color: null })),
  media: [], variantes: [], ...extra,
})
const PRODUCTOS = [
  prod('cm-1', 'Beam 200', 'cabezal-movil', ['Rental']),
  // La primera etiqueta no tiene letras ni números: su id queda vacío y se descarta (no debe correr los labels).
  prod('cm-2', 'Spot 300', 'cabezal-movil', ['***', 'Ready to work']),
  prod('cm-3', 'Wash 400', 'cabezal-movil', ['Rental', 'Ready to work']),
  prod('st-1', 'Strobo Móvil Pro', 'strobo', ['Rental']),
  prod('st-2', 'Flash 100', 'strobo', ['Ready to work']),
  prod('st-3', 'Fresnel Único', 'strobo', ['Garantía extendida']),
  // Línea con muchos productos para poder scrollear.
  ...Array.from({ length: 14 }, (_, i) => prod(`g-${i + 1}`, `Golden ${i + 1}`, 'golden-line', [], { linea: 'Golden Line' })),
]

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
 * `demoras`: ms de demora de cada pedido a /public/productos, por orden de llegada (el que no figura sale enseguida).
 * La página de línea lo pide más de una vez (productos y líneas), pero contentService comparte UNA sola promesa en
 * vuelo: los dos llegan juntos y React los junta en un render. Por eso el estado «líneas listas, productos no» no se
 * puede provocar desde afuera; el caso 6 comprueba que el texto nunca aparece, y que `useState(null)` (en vez de [])
 * es defensa estructural que sólo se ve en el código.
 */
async function nuevaPagina(browser, { demoras = [], fallos = 0, demorasCats = [], basura = false, basuraCats = false, categorias = CATEGORIAS } = {}) {
  const page = await browser.newPage()
  // `page.ctl.fallos`: los primeros N pedidos a /public/productos devuelven 500 (Infinity = siempre; se baja a 0 para «reintentar»).
  // `basura`: /public/productos contesta 200 con algo que NO es una lista (un objeto de error). `pedidos`: cuántas veces
  // se pidió /public/productos de verdad (para probar que «Reintentar» vuelve a pedir y no devuelve lo cacheado).
  page.ctl = { fallos, basura, basuraCats, pedidos: 0, pedidosCats: 0 }
  await page.setViewport({ width: ANCHO, height: ANCHO < 700 ? 844 : 900 })
  await page.setRequestInterception(true)
  let pedidosProductos = 0
  let pedidosCats = 0
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
    if (pathname.endsWith('/public/categorias')) body = categorias
    if (pathname.endsWith('/public/productos')) body = PRODUCTOS
    if (body === null) return req.respond({ status: 404, headers, contentType: 'application/json', body: '{}' })
    const responder = () => req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) })
    if (pathname.endsWith('/public/categorias')) {
      pedidosCats += 1
      page.ctl.pedidosCats = pedidosCats
      if (page.ctl.basuraCats) return void req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Server Error' }) })
      const demoraCats = demorasCats[pedidosCats - 1] ?? 0
      if (demoraCats > 0) return void setTimeout(() => { responder().catch(() => {}) }, demoraCats)
    }
    if (pathname.endsWith('/public/productos')) {
      pedidosProductos += 1
      page.ctl.pedidos = pedidosProductos
      if (page.ctl.basura) return void req.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Server Error' }) })
      if (pedidosProductos <= page.ctl.fallos) return void req.respond({ status: 500, headers, contentType: 'application/json', body: '{}' })
      const demora = demoras[pedidosProductos - 1] ?? 0
      if (demora > 0) return void setTimeout(() => { responder().catch(() => {}) }, demora)
    }
    return responder()
  })
  return page
}

/** Slugs de las fichas que muestra la grilla, ordenados. */
const fichas = (page) =>
  page.$$eval('a[href^="/producto/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href').replace('/producto/', '')))].sort())

const lista = (...xs) => [...xs].sort().join(',')

/** Abre `url` y espera a que la grilla termine de cargar (productos o categorías). */
async function abrir(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(
    () => document.querySelector('a[href^="/producto/"], a[href^="/products/"]') || /Sin coincidencias|Sin resultados/i.test(document.body.innerText),
    { timeout: 15000 },
  )
  await pausa(300)
}

async function sinCoincidencias(page) {
  return page.evaluate(() => /Sin coincidencias|Sin resultados/i.test(document.body.innerText))
}

async function hayGrillaDeCategorias(page) {
  return page.evaluate(
    () => !document.querySelector('a[href^="/producto/"]') && !!document.querySelector('a[href="/products/cabezal-movil"]'),
  )
}

const browser = await puppeteer.launch({ headless: true })
try {
  // 1) Búsqueda por CATEGORÍA y sin acentos ni mayúsculas.
  {
    const page = await nuevaPagina(browser)
    const casos = [
      ['movil', lista('cm-1', 'cm-2', 'cm-3', 'st-1'), '«movil» (sin tilde) encuentra «Móvil»: la categoría Cabezal Móvil y el producto Strobo Móvil Pro'],
      ['MÓVIL', lista('cm-1', 'cm-2', 'cm-3', 'st-1'), '«MÓVIL» (mayúsculas y tilde) da lo mismo'],
      ['cabezal movil', lista('cm-1', 'cm-2', 'cm-3'), '«cabezal movil» (dos palabras) encuentra la categoría aunque el nombre del producto no la diga'],
      ['strobo', lista('st-1', 'st-2', 'st-3'), '«strobo» encuentra los de la categoría Strobo Blinder (por categoría, no por nombre)'],
    ]
    for (const [q, esperado, nombre] of casos) {
      await abrir(page, `/products?q=${encodeURIComponent(q)}`)
      const got = (await fichas(page)).join(',')
      ok(got === esperado, `búsqueda: ${nombre} (${got})`)
    }
    await page.close()
  }

  // 2) Búsqueda por ETIQUETA (con y sin acento).
  {
    const page = await nuevaPagina(browser)
    for (const q of ['garantia', 'GARANTÍA', 'extendida']) {
      await abrir(page, `/products?q=${encodeURIComponent(q)}`)
      const got = (await fichas(page)).join(',')
      ok(got === 'st-3', `búsqueda por etiqueta «${q}» encuentra «Garantía extendida» (${got})`)
    }
    await abrir(page, `/products?q=${encodeURIComponent('zzz')}`)
    ok((await fichas(page)).length === 0 && (await sinCoincidencias(page)), 'búsqueda sin resultados: «Sin resultados», ninguna ficha')
    await page.close()
  }

  // 3) Búsqueda + categoría + etiqueta COMBINADAS, y la barra de filtros visible con búsqueda.
  {
    const page = await nuevaPagina(browser)
    const casos = [
      ['/products?q=movil&etiqueta=rental', lista('cm-1', 'cm-3', 'st-1'), 'búsqueda + etiqueta'],
      ['/products?q=movil&categoria=cabezal-movil', lista('cm-1', 'cm-2', 'cm-3'), 'búsqueda + categoría'],
      ['/products?q=movil&categoria=cabezal-movil&etiqueta=rental', lista('cm-1', 'cm-3'), 'búsqueda + categoría + etiqueta'],
      ['/products?q=movil&categoria=strobo&etiqueta=ready-to-work', '', 'búsqueda + filtros sin ninguna coincidencia'],
    ]
    for (const [url, esperado, nombre] of casos) {
      await abrir(page, url)
      const got = (await fichas(page)).join(',')
      ok(got === esperado, `combinado: ${nombre} → ${esperado || 'nada'} (${got || 'nada'})`)
    }
    ok(await sinCoincidencias(page), 'combinado sin coincidencias: dice «Sin coincidencias»')
    await abrir(page, '/products?q=movil')
    const barra = await page.$$eval('button[aria-haspopup="listbox"]', (bs) => bs.length)
    ok(barra === 2, `la barra de filtros (Categoría, Etiqueta) se ve también con búsqueda (${barra} desplegables)`)
    ok((await page.$eval('h1', (h) => h.textContent)).includes('Resultados'), 'con búsqueda el título sigue siendo «Resultados»')

    // Usar la barra estando en una búsqueda conserva `q` y suma el filtro.
    await page.$$eval('button[aria-haspopup="listbox"]', (bs) => bs[1].click())
    await page.waitForSelector('[role="option"]', { timeout: 10000 })
    await page.evaluate(() => {
      ;[...document.querySelectorAll('[role="option"]')].find((o) => o.textContent.trim().toLowerCase() === 'rental').click()
    })
    await pausa(500)
    ok(ruta(page) === '/products?q=movil&etiqueta=rental', `elegir Rental en la barra conserva la búsqueda (${ruta(page)})`)
    ok((await fichas(page)).join(',') === lista('cm-1', 'cm-3', 'st-1'), 'y la grilla se filtra a las 3 Rental que dicen «movil»')
    await page.close()
  }

  // 4) Valores inválidos en la URL se ignoran.
  {
    const page = await nuevaPagina(browser)
    await abrir(page, '/products?etiqueta=xyz')
    ok(await hayGrillaDeCategorias(page) && !(await sinCoincidencias(page)), '?etiqueta=xyz inexistente: se ignora (grilla de categorías, sin «Sin coincidencias»)')
    await abrir(page, '/products?categoria=inventada')
    ok(await hayGrillaDeCategorias(page) && !(await sinCoincidencias(page)), '?categoria=inventada inexistente: se ignora')
    await abrir(page, '/products?etiqueta=rental,xyz')
    ok((await fichas(page)).join(',') === lista('cm-1', 'cm-3', 'st-1'), '?etiqueta=rental,xyz: queda sólo la válida (Rental)')
    await abrir(page, '/products?q=movil&etiqueta=xyz&categoria=nada')
    ok((await fichas(page)).join(',') === lista('cm-1', 'cm-2', 'cm-3', 'st-1'), '?q=movil con filtros inválidos: sólo cuenta la búsqueda')
    await page.close()
  }

  // 5) CategoryPage: cada etiqueta lleva SU label (la de id vacío se descarta con su label).
  {
    const page = await nuevaPagina(browser)
    await page.goto(`${BASE}/products/cabezal-movil`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('button[aria-pressed]', { timeout: 15000 })
    const etiquetas = await page.$$eval('button[aria-pressed]', (bs) => bs.map((b) => b.textContent.trim().toLowerCase()))
    ok(
      etiquetas.join('|') === 'todos|rental|ready to work',
      `categoría: etiquetas con su label, sin «***» corrido (${etiquetas.join('|')})`,
    )
    await page.close()
  }

  // 6) LinePage: «0 items · Próximamente» no aparece mientras carga (se demora cada uno de los pedidos a productos).
  for (const demoras of [[1500], [0, 1500], [0, 0, 1500]]) {
    const page = await nuevaPagina(browser, { demoras })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'domcontentloaded' })
    let visto = ''
    const t0 = Date.now()
    while (Date.now() - t0 < 1300) {
      const txt = await page.evaluate(() => document.body.innerText)
      const m = txt.match(/\b0 items?\b|Pr[oó]ximamente/i)
      if (m) visto = m[0]
      await pausa(40)
    }
    ok(visto === '', `línea cargando (demora [${demoras}]): no anuncia «0 items»/«Próximamente» (${visto || 'nada'})`)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    ok((await fichas(page)).length === 14, `línea cargada (demora [${demoras}]): 14 productos (${(await fichas(page)).length})`)
    await page.close()
  }

  // 7) LinePage: al volver (atrás del navegador) restaura el scroll.
  {
    const page = await nuevaPagina(browser)
    // Registra los window.scrollTo a 0: al VOLVER (POP) la página no debe mandarse arriba de todo.
    await page.evaluateOnNewDocument(() => {
      window.__scrollsA0 = []
      const orig = window.scrollTo.bind(window)
      window.scrollTo = (...args) => {
        const top = typeof args[0] === 'object' ? args[0]?.top : args[1]
        if (top === 0) window.__scrollsA0.push(location.pathname)
        return orig(...args)
      }
    })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('a[href="/producto/g-12"]', { timeout: 15000 })
    await pausa(300)
    await page.evaluate(() => window.scrollTo(0, 700))
    await pausa(500)
    const y = await page.evaluate(() => window.scrollY)
    ok(y >= 600, `línea: scrolleada (${y})`)
    await page.$eval('a[href="/producto/g-12"]', (a) => a.click())
    await page.waitForFunction(() => location.pathname === '/producto/g-12', { timeout: 15000 })
    await pausa(600)
    await page.evaluate(() => { window.__scrollsA0 = [] })
    await page.goBack()
    await page.waitForSelector('a[href="/producto/g-12"]', { timeout: 15000 })
    await pausa(800)
    const yAtras = await page.evaluate(() => window.scrollY)
    ok(ruta(page) === '/linea/golden-line', `línea: atrás vuelve a la línea (${ruta(page)})`)
    ok(Math.abs(yAtras - y) <= 4, `línea: atrás restaura el scroll (${y} → ${yAtras})`)
    const aCero = await page.evaluate(() => window.__scrollsA0.filter((p) => p === '/linea/golden-line'))
    ok(aCero.length === 0, `línea: al volver NO se manda arriba de todo con scrollTo(0) (${aCero.length} llamadas)`)
    await page.close()
  }

  // 8) LinePage: mientras carga (3 s, productos y líneas salen del mismo pedido) se ve el ESQUELETO de 8 celdas,
  //    no una pantalla negra. Sin el dibujo en el guard de «cargando» no hay ninguna celda .animate-pulse.
  {
    const page = await nuevaPagina(browser, { demoras: [3000] })
    const t0 = Date.now()
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'domcontentloaded' })
    const celdasVisibles = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.animate-pulse')].filter((el) => {
          const r = el.getBoundingClientRect()
          let opacidad = 1
          for (let n = el; n; n = n.parentElement) {
            const cs = getComputedStyle(n)
            if (cs.display === 'none' || cs.visibility === 'hidden') return false
            opacidad *= Number(cs.opacity)
          }
          return r.width > 20 && r.height > 20 && opacidad > 0.5
        }).length,
      )
    for (const ms of [700, 1600, 2600]) {
      await pausa(Math.max(0, ms - (Date.now() - t0)))
      const n = await celdasVisibles()
      const txt = await page.evaluate(() => document.body.innerText)
      ok(n >= 8, `línea cargando (~${ms} ms de 3000): se ven >= 8 celdas de esqueleto (${n})`)
      ok(!/no encontrada/i.test(txt), `línea cargando (~${ms} ms): no parpadea «no encontrada»`)
    }
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(200)
    ok((await celdasVisibles()) === 0 && (await fichas(page)).length === 14, 'línea cargada: sin esqueleto y con sus 14 productos')
    await page.close()
  }

  // 9) API de productos caída (500): la búsqueda NO dice «Sin resultados · 0 items»; dice que no pudo cargar y ofrece Reintentar.
  {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/products?q=spot`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const info = await page.evaluate(() => ({
      txt: document.body.innerText,
      reintentar: [...document.querySelectorAll('button')].some((b) => /Reintentar/i.test(b.textContent)),
    }))
    ok(/No pudimos cargar los productos/i.test(info.txt), 'API 500 + búsqueda: dice «No pudimos cargar los productos»')
    ok(!/Sin resultados/i.test(info.txt) && !/\b0 items\b/i.test(info.txt), 'API 500 + búsqueda: NO dice «Sin resultados» ni «0 items»')
    ok(info.reintentar, 'API 500 + búsqueda: hay un botón Reintentar')
    page.ctl.fallos = 0
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Reintentar/i.test(b.textContent))?.click())
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 }).catch(() => {})
    const tras = (await fichas(page)).join(',')
    ok(tras === 'cm-2', `Reintentar con la API de vuelta trae el resultado de «spot» (${tras || 'nada'})`)
    await page.close()
  }

  // 10) Una búsqueda de puros símbolos no es una búsqueda: sigue la vista de entrada (grilla de categorías), sin «Búsqueda: "%"».
  {
    const page = await nuevaPagina(browser)
    for (const [q, nombre] of [['%', '%'], ['"', '"'], ['\u{1F525}', 'un emoji'], ['% " ?', 'símbolos mezclados']]) {
      await abrir(page, `/products?q=${encodeURIComponent(q)}`)
      const info = await page.evaluate(() => ({ txt: document.body.innerText, h1: document.querySelector('h1')?.textContent ?? '' }))
      ok(
        (await hayGrillaDeCategorias(page)) && !/Búsqueda:/i.test(info.txt) && !/Resultados/.test(info.h1) && !(await sinCoincidencias(page)),
        `q=${nombre}: se ignora (grilla de categorías, sin «Búsqueda:», título «${info.h1.trim()}»)`,
      )
    }
    await abrir(page, `/products?q=${encodeURIComponent('%')}&etiqueta=rental`)
    const txt = await page.evaluate(() => document.body.innerText)
    ok(
      (await fichas(page)).join(',') === lista('cm-1', 'cm-3', 'st-1') && !/Búsqueda:/i.test(txt),
      'q=% + etiqueta=rental: filtra por la etiqueta y no anuncia una búsqueda',
    )
    await page.close()
  }

  // 11) Un solo margen bajo el encabezado de /products con y sin búsqueda (la barra no salta) y placeholder a >= 4,5:1.
  {
    const page = await nuevaPagina(browser)
    const medir = () =>
      page.evaluate(() => {
        const head = document.querySelector('h1').parentElement
        const btn = document.querySelector('button[aria-haspopup="listbox"]')
        const luz = (rgb) => {
          const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map((v) => {
            const c = Number(v) / 255
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const ph = [...btn.querySelectorAll('span')].find((sp) => sp.children.length === 0 && /Seleccionar/i.test(sp.textContent))
        const a = luz(getComputedStyle(ph).color)
        const b = luz(getComputedStyle(btn).backgroundColor)
        return {
          margen: getComputedStyle(head).marginBottom,
          hueco: Math.round((btn.getBoundingClientRect().top - head.getBoundingClientRect().bottom) * 10) / 10,
          contraste: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100,
        }
      })
    await abrir(page, '/products')
    const sin = await medir()
    await abrir(page, '/products?q=movil')
    const con = await medir()
    ok(sin.margen === '40px' && con.margen === '40px', `margen bajo el encabezado: ${sin.margen} sin búsqueda, ${con.margen} con búsqueda (los dos 40px)`)
    ok(sin.hueco === con.hueco, `encabezado → barra de filtros: ${sin.hueco}px sin búsqueda, ${con.hueco}px con búsqueda (iguales)`)
    ok(sin.contraste >= 4.5, `placeholder de la barra de filtros: contraste ${sin.contraste}:1 (>= 4,5)`)
    await page.close()
  }

  // ---- 12-17: errores de la API en LinePage / CategoryPage / buscador del header, esqueleto sin salto, foco de Reintentar ----
  const textoPagina = (page) => page.evaluate(() => document.body.innerText)
  const hayBoton = (page) => page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Reintentar/i.test(b.textContent)))
  const clicReintentar = (page) =>
    page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Reintentar/i.test(b.textContent))?.click())
  /**
   * offsetTop acumulado (px desde el tope del documento) de la grilla de cards: el lugar donde cae, con esqueleto o con datos.
   * offsetTop y no getBoundingClientRect: `.kt-reveal` entra con translateY(18px) y el rect lo cuenta; el layout no.
   */
  const topGrilla = (page) =>
    page.evaluate(() => {
      const g = document.querySelector('div.grid.grid-cols-2')
      if (!g) return null
      let top = 0
      for (let n = g; n; n = n.offsetParent) top += n.offsetTop
      return top
    })

  // 12) LinePage con la API en 500: «No pudimos cargar los productos» + Reintentar, NUNCA «Línea no encontrada · no existe».
  {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const txt = await textoPagina(page)
    ok(/No pudimos cargar los productos/i.test(txt), 'LinePage + API 500: dice «No pudimos cargar los productos»')
    ok(!/no encontrada|no existe|Pr[oó]ximamente|\b0 items\b/i.test(txt), 'LinePage + API 500: NO dice «no encontrada» / «no existe» / «Próximamente» / «0 items»')
    ok(await hayBoton(page), 'LinePage + API 500: hay un botón Reintentar')
    page.ctl.fallos = 0
    await clicReintentar(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 }).catch(() => {})
    const tras = (await fichas(page)).length
    ok(tras === 14 && !/No pudimos cargar/i.test(await textoPagina(page)), `LinePage: Reintentar con la API de vuelta trae las 14 fichas de la línea (${tras})`)
    await page.close()
  }

  // 12b) Lo mismo con una línea que NO es también una categoría. Con «golden-line» (que sí lo es) LinePage redirige a
  //      /products/golden-line y es CategoryPage quien dice «No pudimos cargar»: el `!available` de LinePage quedaba sin
  //      probar (se podía sacar y el caso 12 seguía verde). Acá la lista de categorías llega SIN golden-line.
  {
    const page = await nuevaPagina(browser, { fallos: Infinity, categorias: CATEGORIAS.filter((c) => c.slug !== 'golden-line') })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos|no encontrada/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const txt = await textoPagina(page)
    ok(ruta(page) === '/linea/golden-line', `línea que no es categoría + API 500: se queda en /linea/golden-line, no redirige (${ruta(page)})`)
    ok(/No pudimos cargar los productos/i.test(txt) && !/no encontrada|no existe|Pr[oó]ximamente|\b0 items\b/i.test(txt), 'línea que no es categoría + API 500: dice «No pudimos cargar los productos», NO «Línea no encontrada»')
    ok(await hayBoton(page), 'línea que no es categoría + API 500: hay un botón Reintentar')
    page.ctl.fallos = 0
    await clicReintentar(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 }).catch(() => {})
    ok((await fichas(page)).length === 14, `línea que no es categoría: Reintentar con la API de vuelta trae las 14 fichas (${(await fichas(page)).length})`)
    await page.close()
  }

  // 13) CategoryPage con la API de productos en 500: el hero de la categoría se ve, la grilla dice que no pudo cargar (no «Próximamente»).
  {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/products/strobo`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const info = await page.evaluate(() => ({ txt: document.body.innerText, h1: document.querySelector('h1')?.textContent ?? '' }))
    ok(/Strobo Blinder/.test(info.h1), `CategoryPage + API 500: la categoría sigue visible (h1 «${info.h1.trim()}»)`)
    ok(/No pudimos cargar los productos/i.test(info.txt), 'CategoryPage + API 500: dice «No pudimos cargar los productos»')
    ok(!/Pr[oó]ximamente|\b0 items\b|Cargando productos/i.test(info.txt), 'CategoryPage + API 500: NO dice «Próximamente» ni «0 items»')
    ok(await hayBoton(page), 'CategoryPage + API 500: hay un botón Reintentar')
    page.ctl.fallos = 0
    await clicReintentar(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 }).catch(() => {})
    const tras = (await fichas(page)).join(',')
    ok(tras === lista('st-1', 'st-2', 'st-3'), `CategoryPage: Reintentar con la API de vuelta trae los 3 strobos (${tras || 'nada'})`)
    await page.close()
  }

  // 14) La API contesta 200 con algo que NO es una lista: es un fallo igual que un 500, y «Reintentar» tiene que VOLVER A PEDIR
  //     (fetchWithFallback cachea la promesa; sólo la borraba si el pedido fallaba, no si venía basura).
  {
    const page = await nuevaPagina(browser, { basura: true })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const txtBasura = await textoPagina(page)
    ok(/No pudimos cargar los productos/i.test(txtBasura) && !/no encontrada/i.test(txtBasura), 'API 200 con un objeto (no una lista): LinePage dice «No pudimos cargar», no «no encontrada»')
    const antes = page.ctl.pedidos
    page.ctl.basura = false
    await clicReintentar(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 }).catch(() => {})
    ok(page.ctl.pedidos > antes, `Reintentar con basura cacheada VUELVE A PEDIR /public/productos (${antes} → ${page.ctl.pedidos} pedidos)`)
    ok((await fichas(page)).length === 14, `…y trae las 14 fichas (${(await fichas(page)).length})`)
    await page.close()
  }

  // 15) El buscador del header (sólo existe con sugerencias desde 1024px) con la API caída: «No pudimos buscar», no «Sin coincidencias»;
  //     al volver a enfocarlo con la API de vuelta, busca de verdad.
  if (ANCHO >= 1024) {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/products`, { waitUntil: 'networkidle2' })
    await pausa(500)
    await page.click('input[role="combobox"]')
    await page.type('input[role="combobox"]', 'spot')
    await page.waitForFunction(() => /No pudimos buscar/i.test(document.querySelector('#navPredictiveResults')?.innerText ?? ''), { timeout: 15000 }).catch(() => {})
    const panel = await page.evaluate(() => document.querySelector('#navPredictiveResults')?.innerText ?? '(sin panel)')
    ok(/No pudimos buscar/i.test(panel), `header + API 500: la sugerencia dice que no se pudo buscar («${panel.trim().slice(0, 60)}»)`)
    ok(!/Sin coincidencias/i.test(panel), 'header + API 500: NO dice «Sin coincidencias»')
    page.ctl.fallos = 0
    await page.evaluate(() => document.activeElement?.blur())
    await page.click('input[role="combobox"]')
    await page.waitForFunction(() => /Spot 300/i.test(document.querySelector('#navPredictiveResults')?.innerText ?? ''), { timeout: 15000 }).catch(() => {})
    const panel2 = await page.evaluate(() => document.querySelector('#navPredictiveResults')?.innerText ?? '(sin panel)')
    ok(/Spot 300/i.test(panel2) && !/No pudimos buscar/i.test(panel2), `header: al volver a enfocar con la API de vuelta, busca de verdad («${panel2.trim().slice(0, 40).replace(/\n/g, ' ')}»)`)
    await page.close()
  } else {
    console.log('OMIT  header + API 500: el buscador con sugerencias sólo existe desde 1024px (a 390 el menú manda directo a /products?q=, que ya cubre el caso 9)')
  }

  // 16) El esqueleto reserva el lugar: la grilla cae en el MISMO alto cargando y cargada (LinePage: antes bajaba 223px a 1440 y 182px a 390).
  {
    const TOL = 2
    // LinePage: 2,5 s de demora de productos.
    let page = await nuevaPagina(browser, { demoras: [2500] })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div.grid.grid-cols-2', { timeout: 15000 })
    await pausa(600)
    const lineaAntes = await topGrilla(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(500)
    const lineaDespues = await topGrilla(page)
    ok(lineaAntes !== null && Math.abs(lineaDespues - lineaAntes) <= TOL, `LinePage: la grilla cae en el mismo alto cargando y cargada (${lineaAntes}px → ${lineaDespues}px, tolerancia ${TOL})`)
    await page.close()

    // CategoryPage sin etiquetas (golden-line): categorías tardan 1,5 s y productos 3,5 s → hero fantasma, luego hero real + esqueleto, luego datos.
    page = await nuevaPagina(browser, { demorasCats: [1500], demoras: [3500] })
    await page.goto(`${BASE}/products/golden-line`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div.grid.grid-cols-2', { timeout: 15000 })
    await pausa(500)
    const catFantasma = await topGrilla(page)
    const h1Fantasma = await page.evaluate(() => document.querySelector('h1')?.textContent ?? '')
    await page.waitForFunction(() => document.querySelector('h1') !== null, { timeout: 15000 })
    await pausa(300)
    const catHero = await topGrilla(page)
    await page.waitForSelector('a[href^="/producto/"]', { timeout: 15000 })
    await pausa(500)
    const catFinal = await topGrilla(page)
    ok(h1Fantasma === '', 'CategoryPage cargando la categoría: el encabezado es fantasma (sin título falso)')
    ok(Math.abs(catHero - catFantasma) <= TOL && Math.abs(catFinal - catFantasma) <= TOL, `CategoryPage: la grilla cae en el mismo alto con hero fantasma, hero real y datos (${catFantasma} → ${catHero} → ${catFinal}px)`)
    await page.close()

    // ShopPage: la barra de filtros se reserva mientras cargan los datos (antes aparecía recién con ellos y empujaba la grilla).
    page = await nuevaPagina(browser, { demoras: [2500] })
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div.grid.grid-cols-2', { timeout: 15000 })
    await pausa(600)
    const barraFantasma = await page.evaluate(() => document.querySelectorAll('button[aria-haspopup="listbox"]').length)
    const shopAntes = await topGrilla(page)
    await page.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 15000 })
    await pausa(500)
    const shopDespues = await topGrilla(page)
    ok(barraFantasma === 0, 'ShopPage cargando: la barra es un fantasma (ningún desplegable clickeable todavía)')
    ok(Math.abs(shopDespues - shopAntes) <= TOL, `ShopPage: la grilla cae en el mismo alto con la barra fantasma y con la barra real (${shopAntes}px → ${shopDespues}px)`)
    await page.close()
  }

  // 17) Foco de «Reintentar»: con Tab llega al botón y se ve el contorno amarillo del sitio (2px sólido, offset 2px, color --primary).
  {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/linea/golden-line`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 })
    let llego = false
    for (let i = 0; i < 80 && !llego; i += 1) {
      await page.keyboard.press('Tab')
      llego = await page.evaluate(() => /Reintentar/i.test(document.activeElement?.textContent ?? '') && document.activeElement.tagName === 'BUTTON')
    }
    ok(llego, 'Reintentar es alcanzable con Tab')
    const foco = await page.evaluate(() => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      const probe = document.createElement('i')
      probe.style.color = 'var(--primary)'
      document.body.appendChild(probe)
      const primary = getComputedStyle(probe).color
      probe.remove()
      const r = el.getBoundingClientRect()
      return { w: cs.outlineWidth, st: cs.outlineStyle, off: cs.outlineOffset, color: cs.outlineColor, primary, alto: Math.round(r.height), visible: el.matches(':focus-visible') }
    })
    ok(foco.visible && foco.st === 'solid' && foco.w === '2px' && foco.off === '2px' && foco.color === foco.primary,
      `Reintentar con foco de teclado: contorno ${foco.w} ${foco.st} ${foco.color}, offset ${foco.off} (el del sitio: 2px solid ${foco.primary}, offset 2px)`)
    ok(foco.alto >= 44, `Reintentar es un destino táctil de >= 44px de alto (${foco.alto}px)`)
    await page.close()
  }

  // 18) Una sola «grilla cargando»: las categorías de /products también dibujan el esqueleto compartido (8 celdas CUADRADAS,
  //     como las cards de categoría), no un texto «Cargando categorías…» suelto.
  {
    const page = await nuevaPagina(browser, { demorasCats: [2500] })
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.animate-pulse', { timeout: 15000 })
    await pausa(600)
    const esq = await page.evaluate(() => {
      const celdas = [...document.querySelectorAll('div[aria-busy="true"] > div.animate-pulse')]
      const r = celdas[0]?.getBoundingClientRect()
      // El texto para lectores de pantalla (.sr-only) está a propósito: lo que no debe haber es el texto VISIBLE.
      const copia = document.body.cloneNode(true)
      copia.querySelectorAll('.sr-only').forEach((el) => el.remove())
      return { n: celdas.length, cuadrada: !!r && Math.abs(r.width - r.height) <= 2, txt: copia.textContent }
    })
    ok(esq.n === 8 && esq.cuadrada, `categorías cargando: esqueleto compartido de 8 celdas cuadradas (${esq.n}, cuadradas: ${esq.cuadrada})`)
    ok(!/Cargando categor/i.test(esq.txt), 'categorías cargando: ya no hay un texto «Cargando categorías…» visible')
    await page.waitForSelector('a[href="/products/cabezal-movil"]', { timeout: 15000 })
    await pausa(300)
    ok((await page.$$eval('.animate-pulse', (els) => els.length)) === 0, 'categorías cargadas: el esqueleto desaparece')
    await page.close()
  }
  // 19) /public/categorias contesta 200 con algo que NO es una lista (getCategorias): se lee como «no disponible» y NO queda cacheado,
  //     así que al volver a /products (navegación del SPA, sin recargar) se vuelve a pedir y aparecen las categorías.
  //     (getCategorias cacheaba la basura toda la sesión; /products no tiene botón Reintentar, sólo «probá recargar».)
  {
    const page = await nuevaPagina(browser, { basuraCats: true })
    const irA = (ruta) => page.evaluate((r) => { window.history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')) }, ruta)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await pausa(500)
    await irA('/products')
    await page.waitForFunction(() => /No pudimos cargar el cat[aá]logo/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const conBasura = await page.evaluate(() => ({ txt: document.body.innerText, cards: document.querySelectorAll('a[href="/products/cabezal-movil"]').length }))
    ok(/No pudimos cargar el cat[aá]logo/i.test(conBasura.txt) && conBasura.cards === 0, 'categorías con un 200 que no es lista: /products dice «No pudimos cargar el catálogo» (no una grilla vacía)')
    page.ctl.basuraCats = false
    const antes = page.ctl.pedidosCats
    await irA('/')
    await pausa(300)
    await irA('/products')
    await page.waitForSelector('a[href="/products/cabezal-movil"]', { timeout: 15000 }).catch(() => {})
    const tras = await page.$$eval('a[href^="/products/"]', (as) => as.length)
    ok(page.ctl.pedidosCats > antes, `…y al volver a /products con la API de vuelta se VUELVE A PEDIR /public/categorias (${antes} → ${page.ctl.pedidosCats} pedidos)`)
    ok(tras >= 3 && !/No pudimos cargar el cat[aá]logo/i.test(await textoPagina(page)), `…y aparecen las categorías, no la basura cacheada (${tras} enlaces)`)
    await page.close()
  }

  // ---- 20-23 (4.ª vuelta de ra): esqueleto visible, categorías caídas, aviso de conteo, Reintentar de 44px, borde de la barra ----
  /** Contraste WCAG entre dos colores CSS (acepta `var(--x)`, `#rrggbb`, `rgb()`). */
  const contraste = (page, a, b) =>
    page.evaluate((x, y) => {
      const rgb = (c) => {
        const el = document.createElement('i')
        el.style.color = c
        document.body.appendChild(el)
        const m = getComputedStyle(el).color.match(/\d+/g).map(Number)
        el.remove()
        return m
      }
      const lum = ([r, g, bl]) => {
        const f = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
      }
      const [l1, l2] = [lum(rgb(x)), lum(rgb(y))]
      return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(3)
    }, a, b)

  // 20) VIS-012: el esqueleto usa el token --skeleton (no un hex suelto) y se distingue del fondo: >= 1,3:1 contra --bg.
  {
    const page = await nuevaPagina(browser, { demorasCats: [2500] })
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div[aria-busy="true"] > div.animate-pulse', { timeout: 15000 })
    const info = await page.evaluate(() => {
      const probe = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
      const celda = document.querySelector('div[aria-busy="true"] > div.animate-pulse')
      return { celda: getComputedStyle(celda).backgroundColor, token: probe('var(--skeleton)'), tokenRaw: getComputedStyle(document.documentElement).getPropertyValue('--skeleton').trim(), viejo: probe('#101012') }
    })
    ok(info.tokenRaw !== '' && info.celda === info.token, `esqueleto: la celda usa --skeleton (${info.tokenRaw} → ${info.celda})`)
    ok(info.celda !== info.viejo, 'esqueleto: ya no es el hex suelto #101012')
    const c = await contraste(page, 'var(--skeleton)', 'var(--bg)')
    ok(c >= 1.3 && c <= 1.6, `esqueleto: contraste de --skeleton contra --bg ${c}:1 (objetivo ~1,3:1; antes 1,07:1)`)
    await page.close()
  }

  // 21) VIS-013: CategoryPage con la lista de categorías caída usa CatalogLoadError (el mismo estado de error que el resto del
  //     catálogo: caja punteada, título h3, un solo Reintentar de 44px) y el texto no contradice al botón («recargar la página»).
  {
    const page = await nuevaPagina(browser, { basuraCats: true })
    await page.goto(`${BASE}/products/strobo`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => /No pudimos cargar el cat[aá]logo/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const forma = (p) => p.evaluate(() => {
      const b = [...document.querySelectorAll('button')].filter((x) => /Reintentar/i.test(x.textContent))
      const caja = b[0]?.closest('div.border-dashed')
      return {
        botones: b.length,
        cls: b[0]?.className ?? '',
        cajaCls: (caja?.className ?? '').split(/\s+/).filter((c) => c && !c.startsWith('kt-') && c !== 'is-visible').join(' '),
        titulo: caja?.querySelector('h1,h2,h3')?.textContent ?? '',
        cuerpo: caja?.querySelector('p')?.textContent ?? '',
        alto: Math.round(b[0]?.getBoundingClientRect().height ?? 0),
      }
    })
    const caida = await forma(page)
    ok(caida.botones === 1 && /^No pudimos cargar el cat[aá]logo\./.test(caida.titulo), `categorías caídas: título de CatalogLoadError «${caida.titulo}» y un solo Reintentar (${caida.botones})`)
    ok(!/recarg/i.test(caida.cuerpo) && /Prob[aá] de nuevo/.test(caida.cuerpo), `categorías caídas: el texto no manda recargar (hay botón): «${caida.cuerpo}»`)
    ok(caida.alto >= 44, `categorías caídas: Reintentar de >= 44px (${caida.alto}px)`)
    // Es el MISMO componente que el error de productos: misma clase del botón y de la caja.
    const pagina2 = await nuevaPagina(browser, { fallos: Infinity })
    await pagina2.goto(`${BASE}/products/strobo`, { waitUntil: 'networkidle2' })
    await pagina2.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    const prodCaida = await forma(pagina2)
    ok(caida.cls !== '' && caida.cls === prodCaida.cls && caida.cajaCls === prodCaida.cajaCls, 'categorías caídas: botón y caja son los de CatalogLoadError (mismas clases que el error de productos)')
    await pagina2.close()
    ok(await page.evaluate(() => !!document.querySelector('a[href="/products"]')), 'categorías caídas: sigue el enlace «Volver a productos»')
    page.ctl.basuraCats = false
    await clicReintentar(page)
    await page.waitForFunction(() => /Strobo Blinder/.test(document.querySelector('h1')?.textContent ?? ''), { timeout: 15000 }).catch(() => {})
    ok(await page.evaluate(() => /Strobo Blinder/.test(document.querySelector('h1')?.textContent ?? '')), 'categorías caídas: Reintentar con la API de vuelta muestra la categoría')
    await page.close()
  }

  // 22) VIS-014: /products sin búsqueda con los productos caídos: las categorías SIGUEN visibles y arriba de la grilla hay un aviso
  //     de una línea «No pudimos contar los productos.» con Reintentar (44px) que vuelve a pedir y lo hace desaparecer.
  {
    const page = await nuevaPagina(browser, { fallos: Infinity })
    await page.goto(`${BASE}/products`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('[data-testid="catalog-inline-notice"]', { timeout: 15000 }).catch(() => {})
    const info = await page.evaluate(() => {
      const n = document.querySelector('[data-testid="catalog-inline-notice"]')
      const card = document.querySelector('a[href="/products/cabezal-movil"]')
      const b = n?.querySelector('button')
      return {
        hay: !!n, txt: n?.textContent ?? '', cards: document.querySelectorAll('a[href^="/products/"]').length,
        arriba: !!n && !!card && n.getBoundingClientRect().bottom <= card.getBoundingClientRect().top,
        alto: Math.round(b?.getBoundingClientRect().height ?? 0),
        altoAviso: Math.round(n?.getBoundingClientRect().height ?? 0),
        errorGrande: /No pudimos cargar los productos/i.test(document.body.innerText),
      }
    })
    ok(info.hay && /No pudimos contar los productos\./.test(info.txt), `/products + productos caídos: aviso «${info.txt.replace(/\s+/g, ' ').trim()}»`)
    ok(info.cards >= 3, `/products + productos caídos: las categorías siguen visibles (${info.cards} cards)`)
    ok(info.arriba, '/products + productos caídos: el aviso está ARRIBA de la grilla de categorías')
    ok(info.alto >= 44, `/products + productos caídos: Reintentar de >= 44px (${info.alto}px)`)
    ok(info.altoAviso > 0 && info.altoAviso <= info.alto + 4, `/products + productos caídos: el aviso es de UNA línea (${info.altoAviso}px de alto, el botón mide ${info.alto}px)`)
    ok(!info.errorGrande, '/products + productos caídos: no hay además la caja grande «No pudimos cargar los productos»')
    const antes = page.ctl.pedidos
    page.ctl.fallos = 0
    await clicReintentar(page)
    await page.waitForFunction(() => !document.querySelector('[data-testid="catalog-inline-notice"]') && document.querySelector('a[href="/products/cabezal-movil"]'), { timeout: 15000 }).catch(() => {})
    await pausa(300)
    const tras = await page.evaluate(() => ({ aviso: !!document.querySelector('[data-testid="catalog-inline-notice"]'), conteo: document.querySelector('a[href="/products/cabezal-movil"]')?.textContent ?? '' }))
    ok(page.ctl.pedidos > antes && !tras.aviso, `/products: Reintentar vuelve a pedir los productos (${antes} → ${page.ctl.pedidos}) y el aviso desaparece`)
    ok(/03/.test(tras.conteo), `/products: con la API de vuelta las cards cuentan sus productos («${tras.conteo.replace(/\s+/g, ' ').trim()}»)`)
    await page.close()
    // Sin fallo no hay aviso, y con búsqueda el error es el de la grilla de productos (no el aviso).
    const sana = await nuevaPagina(browser)
    await abrir(sana, '/products')
    ok(await sana.evaluate(() => !document.querySelector('[data-testid="catalog-inline-notice"]')), '/products sana: no hay aviso de conteo')
    await sana.close()
    const buscando = await nuevaPagina(browser, { fallos: Infinity })
    await buscando.goto(`${BASE}/products?q=spot`, { waitUntil: 'networkidle2' })
    await buscando.waitForFunction(() => /No pudimos cargar los productos/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {})
    ok(await buscando.evaluate(() => !document.querySelector('[data-testid="catalog-inline-notice"]') && /No pudimos cargar los productos/i.test(document.body.innerText)),
      '/products?q= + productos caídos: el error es el de la grilla (caja con Reintentar), sin aviso de conteo')
    await buscando.close()
  }

  // 23) VIS-016: el borde de la barra de filtros (y el de su fantasma) es --line-control, el borde de CONTROL (>= 3:1 sobre --bg).
  {
    const page = await nuevaPagina(browser, { demorasCats: [2500] })
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div[aria-hidden="true"] .h-12.animate-pulse', { timeout: 15000 })
    const color = (p, sel) => p.evaluate((s) => {
      const probe = document.createElement('i'); probe.style.color = 'var(--line-control)'; document.body.appendChild(probe)
      const esperado = getComputedStyle(probe).color; probe.remove()
      const el = document.querySelector(s)
      return { borde: el ? getComputedStyle(el).borderTopColor : null, esperado }
    }, sel)
    const fantasma = await color(page, 'div[aria-hidden="true"] .h-12.animate-pulse')
    ok(fantasma.borde === fantasma.esperado, `barra fantasma: borde ${fantasma.borde} = --line-control (${fantasma.esperado})`)
    await page.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 15000 })
    await pausa(300)
    const barra = await color(page, 'button[aria-haspopup="listbox"]')
    ok(barra.borde === barra.esperado, `barra de filtros: borde ${barra.borde} = --line-control (${barra.esperado})`)
    const c = await contraste(page, 'var(--line-control)', 'var(--bg)')
    ok(c >= 3, `barra de filtros: el borde contra --bg da ${c}:1 (>= 3)`)
    await page.close()
  }

  // ---- 24-27 (5.ª vuelta de ra): UNA página de «catálogo caído», h1, «Volver» de 44px con foco, tokens de estado, textos con tilde ----
  /** Lo que hay que comparar de un «catálogo caído»: la caja, su título, su cuerpo, el botón y el enlace «Volver». */
  const caida = (p) => p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Reintentar/i.test(x.textContent))
    const caja = b?.closest('div.border-dashed')
    const volver = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/products' && /Volver/i.test(a.textContent))
    const limpia = (c) => (c ?? '').split(/\s+/).filter((x) => x && !x.startsWith('kt-') && !x.startsWith('col-span') && !x.startsWith('lg:col-span') && !x.startsWith('xl:col-span') && x !== 'is-visible').join(' ')
    const color = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
    const h = caja?.querySelector('h1,h2,h3')
    const cs = caja && getComputedStyle(caja)
    const rv = volver?.getBoundingClientRect()
    const rc = caja?.getBoundingClientRect()
    return {
      hay: !!caja,
      nivel: h?.tagName ?? '',
      h1s: document.querySelectorAll('h1').length,
      titulo: h?.textContent ?? '',
      cuerpo: caja?.querySelector('p')?.textContent ?? '',
      cajaCls: limpia(caja?.className),
      btnCls: b?.className ?? '',
      bg: cs?.backgroundColor, bgToken: color('var(--state-bg)'),
      borde: cs?.borderTopColor, bordeToken: color('var(--line2)'),
      tinta: caja?.querySelector('p') && getComputedStyle(caja.querySelector('p')).color, tintaToken: color('var(--state-ink)'),
      volver: !!volver, volverAlto: Math.round(rv?.height ?? 0), volverCls: volver?.className ?? '',
      sepVolver: rv && rc ? Math.round(rv.top - rc.bottom) : null,
      cajaTop: rc ? Math.round(rc.top + scrollY) : null,
    }
  })
  const abrirCaida = async (opts, url, esperaTexto) => {
    const page = await nuevaPagina(browser, opts)
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' })
    await page.waitForFunction((re) => new RegExp(re, 'i').test(document.body.innerText), { timeout: 15000 }, esperaTexto).catch(() => {})
    await pausa(500)
    return page
  }

  // 24) VIS-017/018/019/020/021: las páginas de «catálogo caído» (categoría y línea) son UNA sola: misma caja, mismo botón, mismo
  //     «Volver», título como h1 (el único) y superficie/borde/tinta de los tokens de estado.
  {
    const pc = await abrirCaida({ basuraCats: true }, '/products/strobo', 'No pudimos cargar el cat[aá]logo')
    const cat = await caida(pc)
    const pl = await abrirCaida({ fallos: Infinity }, '/linea/golden-line', 'No pudimos cargar los productos')
    const lin = await caida(pl)
    ok(cat.hay && lin.hay && cat.cajaCls === lin.cajaCls && cat.btnCls === lin.btnCls && cat.volverCls === lin.volverCls && cat.cajaTop === lin.cajaTop,
      `categoría caída y línea caída son la MISMA página (caja, botón, «Volver» y posición iguales: ${cat.cajaTop}px / ${lin.cajaTop}px)`)
    ok(cat.nivel === 'H1' && cat.h1s === 1 && lin.nivel === 'H1' && lin.h1s === 1, `catálogo caído: el título es el único h1 (${cat.nivel}×${cat.h1s} / ${lin.nivel}×${lin.h1s})`)
    ok(cat.bg === cat.bgToken && cat.borde === cat.bordeToken && cat.tinta === cat.tintaToken,
      `catálogo caído: superficie, borde y tinta salen de --state-bg / --line2 / --state-ink (${cat.bg} · ${cat.borde} · ${cat.tinta})`)
    ok(cat.volver && cat.volverAlto >= 44, `«Volver a productos»: destino táctil de >= 44px (${cat.volverAlto}px)`)
    ok(cat.sepVolver === 16, `«Volver a productos»: 16px (mt-4) bajo la caja (${cat.sepVolver}px)`)
    // Foco del teclado: Tab hasta «Volver» y contorno amarillo del sitio (2px sólido, offset 2px).
    let llego = false
    for (let i = 0; i < 80 && !llego; i += 1) {
      await pc.keyboard.press('Tab')
      llego = await pc.evaluate(() => document.activeElement?.tagName === 'A' && /Volver/i.test(document.activeElement.textContent) && document.activeElement.getAttribute('href') === '/products')
    }
    const foco = llego ? await pc.evaluate(() => {
      const cs = getComputedStyle(document.activeElement)
      const i = document.createElement('i'); i.style.color = 'var(--primary)'; document.body.appendChild(i)
      const primary = getComputedStyle(i).color; i.remove()
      return { ok: document.activeElement.matches(':focus-visible') && cs.outlineStyle === 'solid' && cs.outlineWidth === '2px' && cs.outlineOffset === '2px' && cs.outlineColor === primary, w: cs.outlineWidth, c: cs.outlineColor }
    }) : { ok: false }
    ok(llego && foco.ok, `«Volver a productos»: alcanzable con Tab y con el contorno de foco del sitio (${foco.w} ${foco.c})`)
    // Hover: se subraya (igual que Reintentar).
    ok(/hover:underline/.test(cat.volverCls), '«Volver a productos»: tiene hover (subrayado)')
    await pc.close()
    await pl.close()
  }

  // 25) VIS-017: /products con la lista de categorías caída usa el MISMO estado (CatalogLoadError: misma caja, mismo título y cuerpo,
  //     mismo botón) con su título como h2 (el h1 es «Productos.») y un Reintentar que RECARGA las categorías.
  {
    const pc = await abrirCaida({ basuraCats: true }, '/products/strobo', 'No pudimos cargar el cat[aá]logo')
    const cat = await caida(pc)
    await pc.close()
    const page = await abrirCaida({ basuraCats: true }, '/products', 'No pudimos cargar el cat[aá]logo')
    const shop = await caida(page)
    ok(shop.hay && shop.cajaCls === cat.cajaCls, `/products con categorías caídas: usa la caja de CatalogLoadError («${shop.cajaCls}»)`)
    ok(shop.btnCls === cat.btnCls && shop.titulo === cat.titulo && shop.cuerpo === cat.cuerpo,
      `/products con categorías caídas: mismo título («${shop.titulo}»), mismo cuerpo y mismo botón que la página de categoría`)
    ok(shop.nivel === 'H2' && shop.h1s === 1, `/products con categorías caídas: el título va como h2 y el h1 «Productos.» sigue (${shop.nivel}, ${shop.h1s} h1)`)
    ok(/Prob[aá] de nuevo en un momento/.test(shop.cuerpo) && !/recarg/i.test(shop.cuerpo), `/products con categorías caídas: el texto dice «Probá de nuevo en un momento» y no «recargar» («${shop.cuerpo}»)`)
    const antes = page.ctl.pedidosCats
    page.ctl.basuraCats = false
    await clicReintentar(page)
    await page.waitForSelector('a[href="/products/cabezal-movil"]', { timeout: 15000 }).catch(() => {})
    ok(page.ctl.pedidosCats > antes && (await page.$('a[href="/products/cabezal-movil"]')) !== null,
      `/products: Reintentar recarga las categorías (${antes} → ${page.ctl.pedidosCats} pedidos) y vuelven las cards`)
    ok(!/No pudimos cargar el cat[aá]logo/i.test(await textoPagina(page)), '/products: tras reintentar desaparece «No pudimos cargar el catálogo»')
    await page.close()
  }

  // 26) VIS-020: el aviso de una línea comparte superficie, borde y tinta con la caja de estado (mismos tokens).
  {
    const page = await abrirCaida({ fallos: Infinity }, '/products', 'No pudimos contar los productos')
    const aviso = await page.evaluate(() => {
      const n = document.querySelector('[data-testid="catalog-inline-notice"]')
      const color = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
      const cs = n && getComputedStyle(n)
      return { bg: cs?.backgroundColor, borde: cs?.borderTopColor, tinta: cs?.color, bgT: color('var(--state-bg)'), bordeT: color('var(--line2)'), tintaT: color('var(--state-ink)') }
    })
    ok(aviso.bg === aviso.bgT && aviso.borde === aviso.bordeT && aviso.tinta === aviso.tintaT, `aviso de conteo: superficie, borde y tinta de los tokens de estado (${aviso.bg} · ${aviso.borde} · ${aviso.tinta})`)
    await page.close()
  }

  // 27) VIS-022: los textos de respaldo (los que se ven si falta la clave) llevan tilde, igual que translations.js.
  {
    const fuentes = ['src/features/catalog/components/CatalogLoadError.jsx', 'src/features/catalog/components/CatalogUnavailablePage.jsx', 'src/features/catalog/pages/ShopPage.jsx']
    const sinTilde = []
    for (const f of fuentes) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
      for (const m of src.matchAll(/\bt\('[\w.]+',\s*'([^']*)'/g)) {
        if (/\b(Proba|catalogo|categorias|Todavia|preparacion|busqueda|pagina|Catalogo)\b/.test(m[1])) sinTilde.push(`${f}: ${m[1]}`)
      }
    }
    // VIS-020: ni la caja de estado ni el aviso llevan hex sueltos: superficie, borde y tinta salen de --state-bg / --line2 / --state-ink.
    const hexSuelto = []
    for (const f of ['src/features/catalog/components/CatalogLoadError.jsx', 'src/features/catalog/components/CatalogEmptyState.jsx']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
      for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}/g)) hexSuelto.push(`${f}: ${m[0]}`)
    }
    ok(hexSuelto.length === 0, `CatalogLoadError y CatalogEmptyState sin hex sueltos (${hexSuelto.length ? hexSuelto.join(' | ') : 'todo por token'})`)
    ok(sinTilde.length === 0, `textos de respaldo con tilde en CatalogLoadError / CatalogUnavailablePage / ShopPage (${sinTilde.length ? sinTilde.join(' | ') : 'sin faltas'})`)
  }

  // ---- 28-32 (6.ª vuelta de ra): niveles de título sin saltos, «no encontrada» = misma página, tildes, tokens --bg/--muted, vite de QA ----
  /** Niveles de los títulos del contenido (fuera de header/footer), en orden de documento. */
  const niveles = (p) => p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .filter((h) => !h.closest('header') && !h.closest('footer') && !h.closest('[aria-hidden="true"]') && h.textContent.trim())
    .map((h) => ({ n: Number(h.tagName[1]), t: h.textContent.trim().slice(0, 40) })))
  const sinSaltos = (hs) => hs.length > 0 && hs[0].n === 1 && hs.filter((h) => h.n === 1).length === 1 && hs.every((h, i) => i === 0 || h.n <= hs[i - 1].n + 1)
  const resumen = (hs) => hs.map((h) => `h${h.n} «${h.t}»`).join(' → ')

  // 28) VIS-023: bajo el mismo h1 todos los estados de catálogo (vacío, sin coincidencias, caído) usan el mismo nivel (h2): sin saltos.
  {
    const VACIA = { id: 'c9', slug: 'vacia', nombre: 'Categoría Vacía', orden: 9, image_url: null }
    const casos = [
      ['búsqueda sin resultados', { }, '/products?q=zzzzqq', /Sin resultados/i],
      ['filtros sin coincidencias', { }, '/products?categoria=cabezal-movil&etiqueta=garantia-extendida', /Sin coincidencias/i],
      ['categoría sin productos («Próximamente»)', { categorias: [...CATEGORIAS, VACIA] }, '/products/vacia', /Pr[oó]ximamente/i],
      ['/products con categorías caídas', { basuraCats: true }, '/products', /No pudimos cargar el cat[aá]logo/i],
      ['categoría con productos caídos', { fallos: Infinity }, '/products/strobo', /No pudimos cargar los productos/i],
      ['/products con productos caídos y búsqueda', { fallos: Infinity }, '/products?q=spot', /No pudimos cargar los productos/i],
      ['categoría caída (página)', { basuraCats: true }, '/products/strobo', /No pudimos cargar el cat[aá]logo/i],
      ['categoría no encontrada (página)', { }, '/products/inexistente', /Categor[ií]a no encontrada/i],
      ['línea no encontrada (página)', { }, '/linea/inexistente', /L[ií]nea no encontrada/i],
    ]
    for (const [nombre, opts, url, re] of casos) {
      const page = await nuevaPagina(browser, opts)
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' })
      await page.waitForFunction((r) => new RegExp(r.s, r.f).test(document.body.innerText), { timeout: 15000 }, { s: re.source, f: re.flags }).catch(() => {})
      await pausa(400)
      const hs = await niveles(page)
      ok(sinSaltos(hs) && re.test(await textoPagina(page)), `títulos sin saltos de nivel, ${nombre}: ${resumen(hs)}`)
      await page.close()
    }
  }

  // 29) VIS-026 (7.ª vuelta, decisión del hilo): «no encontrada» (categoría y línea) dibuja el título GRANDE del sitio, igual que el 404
  //     de App.jsx (mismo tamaño, tipografía y guía izquierda), con la misma forma en las dos páginas; «catálogo caído» sigue siendo la caja.
  //     Fondo y tinta salen de --bg / --muted.
  {
    // forma(): scripts/forma-no-encontrada.mjs (la misma medición que usa check-volver-categoria para «Producto no encontrado»)
    const abrir404 = async (opts, url, re) => {
      const p = await nuevaPagina(browser, opts)
      await p.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' })
      await p.waitForFunction((r) => new RegExp(r, 'i').test(document.body.innerText), { timeout: 15000 }, re).catch(() => {})
      await pausa(400)
      return p
    }
    const p404 = await abrir404({}, '/ruta-que-no-existe-xyz', 'no existe')
    const sitio = await forma(p404)
    const pc = await abrir404({}, '/products/inexistente', 'Categor[ií]a no encontrada')
    const cat = await forma(pc)
    const pl = await abrir404({}, '/linea/inexistente', 'L[ií]nea no encontrada')
    const lin = await forma(pl)
    const pd = await abrir404({ basuraCats: true }, '/products/strobo', 'No pudimos cargar el cat[aá]logo')
    const caida = await forma(pd)
    ok(sitio.hay && cat.hay && lin.hay && cat.fuente === sitio.fuente && cat.familia === sitio.familia && cat.interlineado === sitio.interlineado && lin.fuente === sitio.fuente,
      `«no encontrada»: el título tiene el tamaño y la tipografía del 404 del sitio (${cat.fuente} ${cat.interlineado} · el 404: ${sitio.fuente} ${sitio.interlineado})`)
    ok(cat.izq === sitio.izq && lin.izq === sitio.izq, `«no encontrada»: el título arranca en la misma guía izquierda que el 404 (${cat.izq}px / ${lin.izq}px · el 404: ${sitio.izq}px)`)
    ok(cat.top === lin.top && cat.fuente === lin.fuente && cat.h1s === 1 && lin.h1s === 1, `«no encontrada»: categoría y línea idénticas (título a ${cat.top}px / ${lin.top}px, un solo h1)`)
    ok(!cat.caja && !lin.caja && !cat.reintentar && !lin.reintentar, '«no encontrada»: título grande, sin caja punteada y sin Reintentar (es una respuesta, no un fallo)')
    ok(caida.caja && caida.reintentar && caida.fuente !== cat.fuente, `«catálogo caído» sigue siendo la caja con Reintentar (título de ${caida.fuente}, el de «no encontrada» ${cat.fuente})`)
    ok(cat.volverAlto >= 44 && cat.volverIzq === cat.izq && lin.volverAlto >= 44, `«no encontrada»: «Volver a productos» de >= 44px y con el texto en la guía del título (${cat.volverIzq}px / ${cat.izq}px)`)
    // VIS-029 (8.ª vuelta): en «no encontrada» el enlace vuelve a la forma publicada (font-bold text-primary, #f4df33), con los 44px y el foco;
    // el «Volver» gris de la caja de «caída», junto a Reintentar, no cambia.
    ok(cat.volverColor === cat.primary && lin.volverColor === lin.primary && cat.volverPeso >= 700,
      `«no encontrada»: «Volver a productos» en amarillo ${cat.volverColor} (--primary ${cat.primary}) y en negrita (${cat.volverPeso})`)
    ok(cat.volverCls.includes('min-h-[44px]') && /focus-visible:outline-primary/.test(cat.volverCls) && cat.volverAlto >= 44, '«no encontrada»: «Volver a productos» conserva los 44px y el foco de teclado')
    ok(caida.volverColor === caida.tintaEstado && caida.volverColor !== caida.primary, `«catálogo caído»: el «Volver» junto a Reintentar sigue gris (${caida.volverColor})`)
    ok(cat.cuerpoColor === cat.muted && cat.fondo === cat.fondoToken && lin.fondo === lin.fondoToken, `«no encontrada»: cuerpo en --muted y fondo --bg (${cat.cuerpoColor} · ${cat.fondo})`)
    await p404.close(); await pc.close(); await pl.close(); await pd.close()
    // El hex de fondo y de tinta apagada no vive más en las páginas de esta rama: salen de --bg / --muted.
    const sueltos = []
    for (const f of ['src/features/catalog/pages/CategoryPage.jsx', 'src/features/catalog/pages/LinePage.jsx', 'src/features/catalog/pages/ShopPage.jsx', 'src/features/catalog/components/CatalogUnavailablePage.jsx']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
      for (const m of src.matchAll(/bg-\[#050505\]|text-\[#a0a0a0\]/g)) sueltos.push(`${f}: ${m[0]}`)
    }
    ok(sueltos.length === 0, `páginas del catálogo sin bg-[#050505] ni text-[#a0a0a0] sueltos (${sueltos.length ? sueltos.join(' | ') : 'todo por --bg / --muted'})`)
  }

  // 30) VIS-022b / VIS-024: los textos de respaldo y los valores es de lo que se ve en estas pantallas llevan tilde, y el
  //     fallback coincide con la traducción (si falta la clave se ve lo mismo).
  {
    const leer = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
    const MAL = /\b(Proximamente|Volve|Ningun|categoria|categorias|Categoria|catalogo|Catalogo|linea|Recorre|Todavia|busqueda|Busqueda|Proba|pagina)\b/
    const faltas = []
    for (const f of ['src/features/catalog/pages/CategoryPage.jsx', 'src/features/catalog/pages/LinePage.jsx', 'src/features/catalog/pages/ShopPage.jsx', 'src/features/catalog/components/CatalogLoadError.jsx', 'src/features/catalog/components/CatalogUnavailablePage.jsx']) {
      for (const m of leer(f).matchAll(/\bt\('[\w.]+',\s*'([^']*)'/g)) if (MAL.test(m[1])) faltas.push(`${f}: ${m[1].slice(0, 50)}`)
    }
    ok(faltas.length === 0, `fallbacks con tilde en CategoryPage / LinePage / ShopPage / CatalogLoadError / CatalogUnavailablePage (${faltas.length ? faltas.join(' | ') : 'sin faltas'})`)
    const tr = leer('src/shared/i18n/translations.js')
    // El bloque es de /products (shop + catalog) en castellano: del ÚLTIMO «shop: {» hasta «productCard».
    const esBloque = tr.slice(tr.lastIndexOf('    shop: {'), tr.indexOf('    productCard: {', tr.lastIndexOf('    shop: {')))
    const malTr = [...esBloque.matchAll(/'([^']*)'/g)].map((m) => m[1]).filter((v) => MAL.test(v))
    ok(esBloque.length > 200 && malTr.length === 0, `translations.js (es, shop + catalog) sin palabras sin tilde (${malTr.length ? malTr.join(' | ') : 'sin faltas'})`)
    const filtros = leer('src/features/catalog/data/filters.js')
    ok(/label: 'Categoría'/.test(filtros) && !/label: 'Categoria'/.test(filtros), 'filters.js: el eje se llama «Categoría» (con tilde)')
  }

  // 31) REG-005: cada check de navegador dice en su encabezado cómo levantar vite con el hostname de QA.
  {
    const falta = []
    for (const f of ['check-filtros', 'check-blog-marcas', 'check-volver-categoria', 'check-innovaciones-navegador']) {
      const src = readFileSync(new URL(`./${f}.mjs`, import.meta.url), 'utf8')
      const head = src.slice(0, src.indexOf('*/') + 2) // el primer comentario del archivo: su encabezado
      if (!/VITE_API_BASE_URL=http:\/\/api\.qa\.invalid\/api/.test(head) || !/VITE_TIENDITA_ACCOUNT_HOST=kolortec\.qa\.invalid/.test(head)) falta.push(f)
    }
    ok(falta.length === 0, `los 4 checks de navegador documentan VITE_API_BASE_URL / VITE_TIENDITA_ACCOUNT_HOST de QA en su encabezado (${falta.length ? 'faltan: ' + falta.join(', ') : 'completo'})`)
  }

  // 32) VIS-028 (7.ª vuelta): el fondo del control de la barra de filtros (y el de su fantasma) y la tinta de los avisos del buscador del header
  //     salen de tokens: --control-bg y --header-ink (este último con el #b6bec9 EXACTO que ya estaba publicado, no --state-ink).
  //     Ya no hay #0b0b0b ni #b6bec9 sueltos en esos archivos.
  {
    const page = await nuevaPagina(browser, { demorasCats: [2500] })
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div[aria-hidden="true"] .h-12.animate-pulse', { timeout: 15000 })
    const fondo = (sel) => page.evaluate((s) => {
      const probe = document.createElement('i'); probe.style.color = 'var(--control-bg)'; document.body.appendChild(probe)
      const esperado = getComputedStyle(probe).color; probe.remove()
      const el = document.querySelector(s)
      return { bg: el ? getComputedStyle(el).backgroundColor : null, esperado }
    }, sel)
    const fantasma = await fondo('div[aria-hidden="true"] .h-12.animate-pulse')
    ok(fantasma.bg === fantasma.esperado && fantasma.esperado !== '', `barra fantasma: fondo ${fantasma.bg} = --control-bg (${fantasma.esperado})`)
    await page.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 15000 })
    await pausa(300)
    const barra = await fondo('button[aria-haspopup="listbox"]')
    ok(barra.bg === barra.esperado, `barra de filtros: fondo ${barra.bg} = --control-bg (${barra.esperado})`)
    await page.close()
    const sueltos = []
    const buscar = (f, re) => { for (const m of readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').matchAll(re)) sueltos.push(`${f}: ${m[0]}`) }
    buscar('src/features/catalog/components/GridSkeleton.jsx', /bg-\[#0b0b0b\]/g)
    buscar('src/features/catalog/components/CatalogFilterBar.jsx', /bg-\[#0b0b0b\]/g)
    buscar('src/features/landing/components/HeaderSection.jsx', /#b6bec9/g)
    // Lo publicado no cambia: el token conserva EXACTAMENTE el #b6bec9 de HEAD y las dos líneas de mensajes del buscador lo usan.
    const header = readFileSync(new URL('../src/features/landing/components/HeaderSection.jsx', import.meta.url), 'utf8')
    const tinta = await (async () => { const p = await nuevaPagina(browser); await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); const v = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--header-ink').trim().toLowerCase()); await p.close(); return v })()
    ok(tinta === '#b6bec9', `--header-ink conserva el valor publicado #b6bec9 (${tinta || 'sin definir'})`)
    ok(header.split('text-[color:var(--header-ink)]').length - 1 === 2, 'HeaderSection: «Sin coincidencias directas» y «No pudimos buscar» usan --header-ink')
    ok(sueltos.length === 0, `sin #0b0b0b de control ni #b6bec9 sueltos en GridSkeleton / CatalogFilterBar / HeaderSection (${sueltos.length ? sueltos.join(' | ') : 'todo por token'})`)
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
