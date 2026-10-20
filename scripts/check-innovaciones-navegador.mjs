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
 *   · Globo (tarjeta con flechita): muestra el TÍTULO, la descripción y un ícono de 40px; en 1440 y en 390, con TODAS las
 *     fichas abiertas una por una, no se sale de la ventana ni (compu) de la columna, y la flechita cae sobre su ficha.
 *     En compu va por encima de la ficha si hay lugar y si no por debajo; en celular, debajo de la fila tocada, a todo el ancho.
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
const CODIGO = 'LED RGBWA+UV 1200W-XPRO2026' // un código sin sílabas: sólo lo salva el resguardo overflow-wrap: break-word
const SKU = 'REF1200WXPRO2026ABCDE' // un código de una sola pieza: sin sílabas ni guiones, sólo lo salva break-word
const LARGO = 'SISTEMA DE REFRIGERACIÓN ACTIVA CON DISIPADOR DE ALUMINIO Y VENTILACIÓN SILENCIOSA'
function innovaciones(n) {
  return Array.from({ length: n }, (_, i) => ({
    nombre: i === 0 ? SKU : i === 1 ? LARGO : i === 4 ? 'ELECTROMAGNETISMO ANTIRREFLEJANTE' : i === 5 ? CODIGO : `INNOVACIÓN ${i + 1}`,
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
// Mide el globo abierto contra la ventana, la columna (.kt-innov) y la ficha abierta.
const medirGlobo = (page) =>
  page.evaluate(() => {
    const g = document.querySelector('.kt-innov-globo')
    const f = document.querySelector('button.kt-innov-ficha[aria-expanded="true"]')
    const col = document.querySelector('.kt-innov').getBoundingClientRect()
    const r = g.getBoundingClientRect()
    const fr = f.getBoundingClientRect()
    const flecha = parseFloat(getComputedStyle(g).getPropertyValue('--kt-flecha'))
    const icono = g.querySelector('img, .kt-innov-inicial')?.getBoundingClientRect()
    return {
      lado: g.dataset.lado, x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, w: r.width, vw: document.documentElement.clientWidth, vh: innerHeight,
      col0: col.left, col1: col.right, f0: fr.left, f1: fr.right, ft: fr.top, fb: fr.bottom, flechaX: r.left + flecha,
      titulo: (g.querySelector('.kt-innov-globo-titulo')?.textContent || '').replace(/­/g, ''), tituloFicha: f.querySelector('.min-w-0').textContent.replace(/­/g, '').trim(),
      tituloMay: getComputedStyle(g.querySelector('.kt-innov-globo-titulo')).textTransform === 'uppercase', tituloPeso: getComputedStyle(g.querySelector('.kt-innov-globo-titulo')).fontWeight,
      iconoW: icono?.width, iconoH: icono?.height, texto: g.querySelector('.kt-innov-globo-texto')?.textContent || '',
    }
  })
const contador = (page) => page.$eval('.kt-innov-pag', (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null)
const hint = (page) => page.$eval('.kt-innov-hint', (e) => e.innerText)
const irAPagina = async (page, n) => {
  await page.$eval('.kt-innov-pista', (p, k) => p.scrollTo({ left: p.children[k].offsetLeft - p.children[0].offsetLeft, behavior: 'instant' }), n)
  await espera(500)
}
const COMPU = { width: 1440, height: 900 }
const CELU = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const TABLET = { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

// Títulos de las fichas visibles: una palabra partida tiene que llevar guion suave; `break-word` es sólo resguardo para códigos.
const cortesDeTitulos = (page) =>
  page.evaluate(() => {
      const malas = []
      let partidas = 0
      let largas = 0
      for (const t of document.querySelectorAll('.kt-innov-ficha .min-w-0')) {
        const cs = getComputedStyle(t)
        const regla = `${cs.overflowWrap}/${cs.wordBreak}/${cs.hyphens}`
        const caja = t.getBoundingClientRect().width
        for (const m of t.textContent.matchAll(/\S+/g)) {
          const r = document.createRange()
          r.setStart(t.firstChild, m.index)
          r.setEnd(t.firstChild, m.index + m[0].length)
          const lineas = new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size
          // ancho natural de la palabra con la misma tipografía
          const medida = document.createElement('span')
          medida.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;hyphens:none'
          medida.textContent = m[0]
          t.appendChild(medida)
          const natural = medida.getBoundingClientRect().width
          medida.remove()
          if (natural > caja + 0.5) largas += 1
          if (lineas > 1) {
            partidas += 1
            // `break-word` es el resguardo para códigos; una palabra de sólo letras tiene que partirse en un guion suave.
            const soloLetras = /^\p{L}+­?[\p{L}­]*$/u.test(m[0])
            if (cs.hyphens !== 'auto' || cs.overflowWrap === 'anywhere' || /break-all/.test(cs.wordBreak) || (soloLetras && !m[0].includes('­'))) malas.push(`${m[0]} (${regla})`)
          }
        }
        if (t.scrollWidth > t.clientWidth + 1 || t.closest('.kt-innov-ficha').scrollWidth > t.closest('.kt-innov-ficha').clientWidth + 1) malas.push(`desborda: ${t.textContent}`)
      }
      // resguardo declarado en la ficha y en el globo, y el código no desborda ni se sale de la ficha
      const resguardo = ['.kt-innov-ficha .min-w-0', '.kt-innov-globo-titulo'].every((q) => { const e = document.querySelector(q); return !e || getComputedStyle(e).overflowWrap === 'break-word' })
      if (!resguardo) malas.push('falta overflow-wrap: break-word en el título')
      const codigo = [...document.querySelectorAll('.kt-innov-ficha .min-w-0')].find((e) => e.textContent.includes('XPRO2026'))
      if (!codigo) malas.push('no está el título con código en la página 1')
      return { malas, partidas, largas }
    })

// ¿Lo que está arriba del globo, en toda su altura (elementFromPoint), es el globo o algo adentro suyo? Atrapa líneas/capas de la página dibujadas encima.
const globoEncima = (page) =>
  page.evaluate(() => {
    const g = document.querySelector('.kt-innov-globo')
    const r = g.getBoundingClientRect()
    const x = r.left + r.width / 2
    const malos = []
    let probados = 0
    for (let y = Math.max(r.top + 3, 1); y < Math.min(r.bottom - 2, innerHeight - 1); y += 6) {
      probados += 1
      const e = document.elementFromPoint(x, y)
      if (!e || !g.contains(e)) malos.push(`${Math.round(y)}:${e ? e.tagName + '.' + String(e.className).slice(0, 30) : 'null'}`)
    }
    return { malos, probados }
  })

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
    ok(await page.evaluate(() => {
      const f = document.querySelectorAll('button.kt-innov-ficha')[2]
      const d = document.getElementById(f.getAttribute('aria-describedby'))
      return !!d && d.classList.contains('kt-innov-globo-texto') && /Descripción de la innovación 5\./.test(d.textContent) && !d.textContent.includes('INNOVACIÓN')
    }), 'aria-describedby apunta a la descripción (no al globo entero: el título no se lee dos veces)')
    ok(Math.abs(alto0 - await page.$eval('.kt-innov', (r) => r.getBoundingClientRect().height)) < 1, 'abrir el globo no mueve el layout')
    await botones[3].hover(); await espera(200)
    ok((await expandidas(page)).join() === '3', 'pasar a otra ficha: sólo queda abierta la nueva')
    // WCAG 1.4.13: se puede pasar del mouse de la ficha al globo (cruzando el hueco) y recorrerlo sin que se cierre
    {
      const g = await page.$eval('.kt-innov-globo', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
      const f = await botones[3].boundingBox()
      await page.mouse.move(f.x + f.width / 2, f.y + f.height / 2)
      await page.mouse.move(g.x, g.y, { steps: 8 }); await espera(400)
      ok((await expandidas(page)).join() === '3' && await globoVisible(page), 'el mouse pasa de la ficha al globo y sigue abierto (1.4.13)')
      await page.mouse.move(g.x + 3, g.y + 3, { steps: 3 }); await espera(300)
      ok(await globoVisible(page), 'recorrer el globo con el mouse no lo cierra')
      await page.keyboard.press('Escape'); await espera(150)
      ok(!(await globoVisible(page)), 'Escape cierra aunque el mouse esté sobre el globo')
      await botones[3].hover(); await espera(200)
    }
    await page.mouse.move(5, 5); await espera(300)
    ok((await expandidas(page)).length === 0 && !(await globoVisible(page)), 'sacar el mouse cierra (con ~120ms de margen)')
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
    // Globo nuevo: título + descripción + ícono 40px; nunca fuera de la ventana ni de la columna; flechita sobre su ficha
    const todos = await page.$$('button.kt-innov-ficha')
    const malos = []
    let arriba = 0
    let abajo = 0
    for (let k = 0; k < todos.length; k += 1) {
      // la 1.ª ficha con la fila pegada al borde de arriba de la ventana (no hay lugar encima → va por debajo)
      if (k === 0) await page.evaluate(() => { const f = document.querySelector('button.kt-innov-ficha'); window.scrollBy(0, f.getBoundingClientRect().top - 90) })
      await todos[k].hover(); await espera(120)
      const m = await medirGlobo(page)
      if (m.lado === 'arriba') arriba += 1
      else abajo += 1
      const dentro = m.x0 >= -0.5 && m.x1 <= m.vw + 0.5 && m.x0 >= m.col0 - 0.5 && m.x1 <= m.col1 + 0.5
      const alineado = m.flechaX >= m.f0 - 0.5 && m.flechaX <= m.f1 + 0.5
      const lugar = m.lado === 'arriba' ? m.y1 <= m.ft && m.y0 >= 0 : m.y0 >= m.fb
      if (!dentro || !alineado || !lugar || m.w > 300.5 || !m.titulo || m.titulo !== m.tituloFicha || !/Descripción de la innovación \d+\./.test(m.texto) || Math.round(m.iconoW) !== 40 || Math.round(m.iconoH) !== 40) {
        malos.push(`${k}:${JSON.stringify(m)}`)
      }
    }
    ok(malos.length === 0, 'compu: las 18 fichas abren un globo dentro de la ventana y de la columna, con título, descripción, ícono 40px y flechita sobre su ficha', malos[0] || '')
    ok(arriba > 0 && abajo > 0, 'compu: va por encima si hay lugar y por debajo si no', `arriba=${arriba} abajo=${abajo}`)
    {
      await todos[todos.length - 1].hover(); await espera(200)
      const e = await globoEncima(page)
      ok(e.probados > 5 && e.malos.length === 0, '1440: el globo queda por encima de toda la página (elementFromPoint)', JSON.stringify(e))
    }
    const t0 = await medirGlobo(page)
    ok(t0.tituloMay && t0.tituloPeso === '700', 'el título va en mayúsculas y peso 700', JSON.stringify({ may: t0.tituloMay, peso: t0.tituloPeso }))
    ok(await page.$eval('.kt-innov-globo', (g) => { const c = getComputedStyle(g); return parseFloat(c.paddingLeft) > 0 && /0\.6/.test(c.borderTopColor) && c.boxShadow !== 'none' && c.animationName.includes('kt-innov-globo-in') && c.animationDuration === '0.14s' }), 'globo: borde de marca, sombra y entrada de 140ms')
    await page.mouse.move(5, 5)
    await page.close()

    console.log('Globo con prefers-reduced-motion')
    page = await abrir(browser, { slug: 'p20', viewport: COMPU })
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    ok(await page.$eval('.kt-innov-globo', (g) => getComputedStyle(g).animationName === 'none'), 'con movimiento reducido el globo no se anima')
    await page.close()

    console.log('13 innovaciones · 390 táctil')
    page = await abrir(browser, { slug: 'p13', viewport: CELU })
    ok(/deslizá/.test(await hint(page)) && /13 innovaciones/.test(await hint(page)), 'texto: «13 innovaciones · deslizá para ver más · tocá una…»')
    ok((await page.$$('.kt-innov-punto')).length === 3, '13 → 3 páginas (3 puntos)')
    ok((await contador(page)) === '1 / 3', 'contador «1 / 3»')
    ok(await page.$eval('.kt-innov-pista', (p) => p.getAttribute('aria-roledescription') === 'carrusel'), 'aria-roledescription="carrusel"')
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'la página no scrollea de costado')
    // Títulos largos en la ficha: una palabra partida tiene que llevar guion (hyphens:auto con el idioma de la página).
    // El guion automático no está en el DOM, así que se prueba la causa: ninguna regla que corte «en seco»
    // (overflow-wrap anywhere/break-word, word-break) y, si no se corta, que NADA desborde la caja de la ficha.
    const cortes = await cortesDeTitulos(page)
    ok(cortes.malas.length === 0, 'celular: ninguna palabra del título se corta en seco ni desborda la ficha (sólo con guion)', JSON.stringify(cortes))
    ok(cortes.largas > 0 && cortes.partidas > 0, 'celular: hay palabras más largas que la caja y se parten (el caso se está probando)', JSON.stringify(cortes))
    const pagina1 = await page.$$('.kt-innov-pagina:nth-child(1) .kt-innov-ficha')
    ok(pagina1.length === 6, 'página 1 con 6 fichas')
    const bots = await page.$$('button.kt-innov-ficha')
    await bots[0].tap(); await espera(200)
    ok((await expandidas(page)).join() === '0' && await globoVisible(page), 'tocar abre')
    {
      const m = await medirGlobo(page)
      ok(m.x0 >= -0.5 && m.x1 <= m.vw + 0.5 && m.y1 > 0, 'celular: el globo no se sale de la ventana', JSON.stringify(m))
      ok(m.lado === 'abajo' && m.y0 >= m.fb && Math.abs(m.w - (m.col1 - m.col0)) < 1, 'celular: tarjeta a todo el ancho de la columna, debajo de la fila tocada')
      ok(m.flechaX >= m.f0 - 0.5 && m.flechaX <= m.f1 + 0.5 && m.titulo === m.tituloFicha && Math.round(m.iconoW) === 40, 'celular: flechita sobre la ficha, con título e ícono de 40px')
    }
    {
      const ult = (await page.$$('.kt-innov-pagina:nth-child(1) button.kt-innov-ficha')).pop()
      await bots[0].tap(); await espera(150) // cierra el globo de la 1.ª (con el globo abierto, un toque sobre él lo cierra)
      await ult.evaluate((b) => window.scrollBy(0, b.getBoundingClientRect().top - 160))
      await ult.tap(); await espera(250)
      const e = await globoEncima(page)
      ok(e.probados > 5 && e.malos.length === 0, '390: el globo de la última fila queda por encima de toda la página (elementFromPoint)', JSON.stringify(e))
      await bots[0].evaluate((b) => window.scrollBy(0, b.getBoundingClientRect().top - 160)) // de vuelta, sin que la cabecera fija tape la ficha
      await bots[0].tap(); await espera(200)
    }
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
    ok(await page.$eval('.kt-innov', (r) => r.getAttribute('lang') === 'en'), 'EN: el contenedor lleva lang="en" (hyphens:auto usa el idioma correcto)')
    ok(await page.$$eval('.kt-innov-ficha .min-w-0', (ts) => ts.every((t) => t.lang === 'es')), 'EN: el título de la ficha es contenido en español (lang="es") aunque la página esté en inglés')
    await page.close()
    page = await abrir(browser, { slug: 'p13', viewport: CELU, lang: 'en' })
    ok(/swipe for more · tap one/.test(await hint(page)), 'celular: texto en inglés')
    {
      const c = await cortesDeTitulos(page)
      ok(c.malas.length === 0, 'EN 390: ninguna palabra larga de letras se corta en seco ni desborda (el contenido es español: se silabea igual)', JSON.stringify(c))
      ok(c.largas > 0 && c.partidas > 0, 'EN 390: hay palabras largas y se parten con guion (el caso se está probando)', JSON.stringify(c))
      ok(await page.$$eval('.kt-innov-ficha .min-w-0', (ts) => ts.some((t) => t.textContent.includes('­'))), 'EN: los títulos llevan guiones suaves')
      const bs = await page.$$('button.kt-innov-ficha')
      await bs[3].evaluate((b) => window.scrollBy(0, b.getBoundingClientRect().top - 160))
      await bs[3].tap(); await espera(250)
      ok(await page.$eval('.kt-innov-globo', (g) => g.querySelector('.kt-innov-globo-titulo').lang === 'es' && g.querySelector('.kt-innov-globo-texto').lang === 'es'), 'EN: título y descripción del globo con lang="es"')
      const e = await globoEncima(page)
      ok(e.probados > 5 && e.malos.length === 0, 'EN 390: el globo queda por encima de toda la página (elementFromPoint)', JSON.stringify(e))
    }
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
