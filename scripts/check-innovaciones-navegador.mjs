/**
 * check-innovaciones-navegador.mjs — comportamiento REAL en navegador de las innovaciones de la ficha
 * (InnovacionesGrilla, opción C1 del mockup 2026-10-21-innovaciones-imagen: recuadro de detalle ARRIBA de la grilla,
 * que reemplaza al globo flotante de la opción B del 2026-10-20). Complementa a check-innovaciones-grilla.mjs
 * (lógica pura): acá se prueba lo que sólo existe con layout, hover, foco, toque y scroll.
 *
 * Qué prueba, con datos FALSOS de 4, 5, 13 y 20 innovaciones (una sin descripción, una con sólo espacios,
 * un título largo, una descripción larguísima, una con imagen), con la API pública mockeada por intercepción
 * (no pega a ningún servidor):
 *   · 4 o menos = lista de siempre (sin recuadro); 5 o más = recuadro + grilla.
 *   · Al cargar el recuadro muestra la PRIMERA (y su ficha lleva aria-current="true" y el borde en --primary).
 *   · 1440 con mouse: señala la ficha bajo el puntero (queda la última si el puntero se va); con el teclado, la que
 *     tiene el foco; Escape no hace nada especial; no queda globo, role=tooltip ni aria-describedby/expanded.
 *   · CLICK SIN FOCO (joan REG-001): en iOS Safari tocar un botón no le da foco, así que onFocus no alcanza. El click se
 *     despacha con element.click() (no enfoca y no hay pointerenter) y tiene que señalar igual: sacar onClick lo pone en rojo.
 *   · ALTO ESTABLE: con las 18 fichas señaladas una por una (incluida la de la descripción larguísima) el recuadro
 *     mide siempre lo mismo y la grilla no se mueve ni un píxel (el mouse está encima de ella).
 *   · 390 táctil: tocar señala (una sola; volver a tocar la misma la deja), puntos y «n / N» sincronizados al
 *     deslizar, 13 → 3 páginas; AL CAMBIAR DE PÁGINA se señala la primera ficha con descripción de la página nueva
 *     (el recuadro nunca muestra una que no está a la vista), salvo que el foco ya haya señalado una de esa página;
 *     Tab hacia una ficha de OTRA página la señala y desplaza el carrusel; el recuadro queda arriba del carrusel,
 *     no cambia de alto y su piso es el estructural de 118px (sin el 164 de antes).
 *   · Accesibilidad: el recuadro es role=region con aria-label y SIN aria-live (hover = un anuncio por ficha, teclado =
 *     dos veces; joan REG-004 / ra VIS-002); las fichas son botones con aria-controls hacia el recuadro, aria-current
 *     "true" la señalada y NUNCA aria-pressed (ra VIS-007); la capa que mide el alto está aria-hidden y no se ve.
 *   · Imagen rota (404): la ficha y el recuadro caen a la inicial, sin cuadrado negro con ícono roto (joan REG-002).
 *   · Ninguna innovación con descripción: sin recuadro y el texto sólo cuenta («N innovaciones»), sin prometer un detalle
 *     (joan REG-003).
 *   · N2, columna angosta (ra VIS-001, elegida por Fedev): con el contenedor .kt-innov a 250px o menos (notebook de 1024:
 *     232px) la imagen del recuadro pasa a 48×48 al lado del título (gap 12, centrados en vertical) y la descripción va
 *     debajo a todo el ancho (margin-top 6); a 1440 y 390 sigue C1. Sacar la regla @container lo pone en rojo.
 *   · Ficha apilada en celular angosto: con la columna de 338px o menos (320 de ancho → fichas de ~117px) la imagen (44, sin
 *     cambio) va arriba, centrada, y el nombre debajo, centrado, a todo el ancho de la ficha y con gap 8. Con los NOMBRES
 *     REALES de las 9 innovaciones de Kolortec: ninguna palabra se parte sin guion y ningún título pasa de 3 renglones. A 390
 *     (fichas de ~152px) queda con la imagen al lado. Sin la regla @container de la ficha, falla.
 *   · Ficha apilada (VIS-008): a 320, 360 y 375 las imágenes de cada fila de fichas quedan a la misma altura (tolerancia 1px),
 *     aunque un nombre ocupe más renglones que el de al lado.
 *   · Compu 1024 (REG-005): con la columna de 232px la ficha NO se apila (imagen al lado del nombre): el apilado es sólo de celular.
 *   · Recuadro clavado (VIS-010): en compu es position: sticky bajo el navbar y la barra de secciones; a 1024×768 con el mouse
 *     sobre la ficha 9 su título está dentro de la ventana y debajo de las dos barras; en celular no es sticky.
 *   · Recuadro clavado, bordes (ra VIS-013/014/015): a 1024×768 y en varios pasos de scroll clavado nada de las fichas se ve en la
 *     franja de 12px entre la barra de secciones y el recuadro; al soltarse al final el recuadro NO pisa la última ficha (queda
 *     entera, visible y sin tapar); --innov-detalle-h es el alto del recuadro redondeado hacia arriba.
 *   · Sólo cuando hace falta: a 1440×900 con las 9 reales la grilla y el recuadro entran en la ventana, no hay clase
 *     kt-innov--clavable, ni sticky ni espacio vacío debajo de la grilla; a 1024×768 sí hay clase.
 *   · Re-medido del alto publicado (joan REG-001/002): con el ResizeObserver anulado y document.fonts.ready controlado por el check,
 *     un cambio de menos de 1px del recuadro DESPUÉS de montar sólo lo recoge el re-medido (fonts.ready o `load`); lo publicado
 *     es el techo del alto real (130,3 → 131, no 130).
 *   · Filtro de coordenadas del pointermove (joan REG-003): un pointermove con las MISMAS coordenadas que el anterior, tras un
 *     scroll que dejó otra ficha bajo el puntero, no cambia la señalada; con otras coordenadas, sí.
 *   · Clase al cargar (ra VIS-019): a un alto de ventana donde la grilla necesita clavarse sólo con la barra de secciones ya medida
 *     (1280 de ancho), la página recién cargada, SIN resize, ya lleva kt-innov--clavable.
 *   · Rueda (ra VIS-016): con el puntero quieto, la rueda NO cambia la ficha señalada aunque pase otra por debajo del puntero.
 *   · Título y descripción de la lista de 4 o menos y del recuadro leen los mismos tokens --innov-titulo-* / --innov-texto-*
 *     (15px/1.5, 13.5px/1.55, --ink y --soft; ra VIS-004/005). .kt-innov es container-type: inline-size (VIS-001, sin @container).
 *   · Ficha sin descripción (o de sólo espacios) = sin botón, no se señala.
 *   · Medidas del mockup: recuadro con borde 1px --primary, fondo --innov-detalle-bg, padding 16, gap 16, imagen
 *     84×84 (object-fit contain), título 15px en mayúsculas, texto 13.5px/1.55 en --soft; ficha con imagen de 44px.
 *   · Silabeo (conGuiones, lang="es") en los títulos de las fichas y del recuadro; nada desborda ni se corta en seco.
 *   · Tablet táctil ≥768px: el texto no dice «mouse». Idioma EN: textos en inglés.
 *
 * Usa `puppeteer` (ya devDependency del repo, como check-media / check-volver-categoria) con el Chrome instalado.
 * Levanta su propio `vite` en KT_PORT (por defecto 5192) salvo que se pase KT_BASE con uno ya corriendo.
 * Necesita VITE_API_BASE_URL y VITE_TIENDITA_ACCOUNT_HOST en el entorno (los de .env.development de kolortec).
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
const DESC_LARGA = `Descripción larga de la innovación 9. ${'Texto de relleno para que esta descripción sea la más alta de todas. '.repeat(6)}`
const IMG_URL = 'https://archivos.test/innovacion-7.png'
const IMG_404 = 'https://archivos.test/roto-404.png' // responde 404
// PNG de 1×1 (la imagen de la innovación 7; el tamaño lo pone el CSS)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
function innovaciones(n) {
  return Array.from({ length: n }, (_, i) => ({
    nombre: i === 0 ? SKU : i === 1 ? LARGO : i === 4 ? 'ELECTROMAGNETISMO ANTIRREFLEJANTE' : i === 5 ? CODIGO : `INNOVACIÓN ${i + 1}`,
    descripcion: i === 2 ? '' : i === 3 ? '   ' : i === 8 ? DESC_LARGA : `Descripción de la innovación ${i + 1}.`,
    media_url: i === 6 ? IMG_URL : null,
  }))
}
const producto = (n) => ({
  id: `p${n}`, slug: `p${n}`, nombre: `PRODUCTO ${n}`, categoria: 'Efectos', moneda: 'ARS', precio: null,
  descripcion: 'Producto de prueba.', img_url: '', imagenes: [], innovaciones: innovaciones(n), variantes: [], specs: [], docs: [], media: [],
})
// 6 innovaciones cuya PRIMERA (señalada al cargar) tiene una imagen que responde 404
const productoRoto = { ...producto(6), id: 'roto', slug: 'roto', innovaciones: innovaciones(6).map((x, i) => (i === 0 ? { ...x, media_url: IMG_404 } : x)) }
// 13 innovaciones y NINGUNA con descripción (vacía o de sólo espacios): no hay nada que mostrar en un recuadro
const productoSinDesc = { ...producto(13), id: 'sd13', slug: 'sd13', innovaciones: innovaciones(13).map((x, i) => ({ ...x, descripcion: i % 2 ? '   ' : '' })) }
// Los 9 nombres REALES de Kolortec (los del mockup): lo que de verdad se ve en el celular
const NOMBRES_REALES = ['APERTURA', 'PROTECCIÓN Y CONSTRUCCIÓN', 'TEMPERATURA DE COLOR', 'ALIMENTACIÓN', 'SALIDA DE LUZ', 'CAUDAL Y ALCANCE', 'FLUIDO', 'CONEXIONES', 'COMPATIBILIDAD']
const productoReal = { ...producto(9), id: 'real9', slug: 'real9', innovaciones: NOMBRES_REALES.map((nombre) => ({ nombre, descripcion: `Descripción de ${nombre}.`, media_url: null })) }
const PRODUCTOS = [...[4, 5, 13, 20].map(producto), productoRoto, productoSinDesc, productoReal]
// ficha n-ésima de las que son botón (las innovaciones 3.ª y 4.ª no lo son) → número de innovación (1-based)
const numeroDeBoton = (k) => (k < 2 ? k + 1 : k + 3)
const descEsperada = (k) => (numeroDeBoton(k) === 9 ? DESC_LARGA.trim() : `Descripción de la innovación ${numeroDeBoton(k)}.`)

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
async function abrir(browser, { slug, viewport, lang, antes }) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  if (antes) await page.evaluateOnNewDocument(antes)
  if (lang) await page.evaluateOnNewDocument((l) => window.localStorage.setItem('kolortec-lang', l), lang)
  await page.setRequestInterception(true)
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
  page.on('request', (req) => {
    const url = req.url()
    if (url === IMG_URL) return req.respond({ status: 200, contentType: 'image/png', body: PNG })
    if (url === IMG_404 || url.startsWith(IMG_404 + '?')) return req.respond({ status: 404, contentType: 'text/plain', body: 'no está' })
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
const senaladas = (page) => page.$$eval('button.kt-innov-ficha', (bs) => bs.map((b, i) => [i, b.getAttribute('aria-current')]).filter(([, v]) => v === 'true').map(([i]) => i))
// click despachado SIN dar foco ni pasar el puntero (como un toque en iOS Safari); devuelve si el botón quedó con foco
const clickSinFoco = (boton) => boton.evaluate((b) => { b.click(); return document.activeElement === b })
const quitarSoft = (t) => (t || '').replace(/­/g, '').trim()
// Lo que muestra el recuadro (la copia VISIBLE, no la capa de medida) y dónde está, en coordenadas de la PÁGINA.
const medirDetalle = (page) =>
  page.evaluate(() => {
    const d = document.querySelector('.kt-innov-detalle')
    const v = d.querySelector(':scope > .kt-innov-detalle-item')
    const r = d.getBoundingClientRect()
    const pista = document.querySelector('.kt-innov-pista').getBoundingClientRect()
    const fichas = [...document.querySelectorAll('.kt-innov-ficha')]
    const ult = fichas[fichas.length > 6 ? 5 : fichas.length - 1].getBoundingClientRect() // una de la 1.ª página: no depende del scroll horizontal
    const tit = v.querySelector('.kt-innov-detalle-titulo')
    const txt = v.querySelector('.kt-innov-detalle-texto')
    const img = v.querySelector('img, .kt-innov-inicial')
    const ir = img?.getBoundingClientRect()
    const y = scrollY
    return {
      h: r.height, w: r.width, top: r.top + y, bottom: r.bottom + y, pistaTop: pista.top + y, ultTop: ult.top + y,
      titulo: tit.textContent.replace(/­/g, '').trim(), texto: txt.textContent.trim(),
      imgW: ir?.width, imgH: ir?.height, imgEsImg: img?.tagName === 'IMG', fit: img ? getComputedStyle(img).objectFit : null,
      desborda: d.scrollWidth > d.clientWidth + 1 || v.scrollWidth > v.clientWidth + 1,
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

// Títulos de las fichas visibles: una palabra partida tiene que llevar guion suave; `break-word` es sólo el resguardo para códigos.
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
      // resguardo declarado en la ficha y en el recuadro, y el código no desborda ni se sale de la ficha
      const resguardo = ['.kt-innov-ficha .min-w-0', '.kt-innov-detalle-titulo', '.kt-innov-detalle-texto'].every((q) => { const e = document.querySelector(q); return !e || getComputedStyle(e).overflowWrap === 'break-word' })
      if (!resguardo) malas.push('falta overflow-wrap: break-word en el título')
      const codigo = [...document.querySelectorAll('.kt-innov-ficha .min-w-0')].find((e) => e.textContent.includes('XPRO2026'))
      if (!codigo) malas.push('no está el título con código en la página 1')
      return { malas, partidas, largas }
    })

// ---- escenarios ------------------------------------------------------------------------------------------
async function main() {
  await levantar()
  const browser = await puppeteer.launch({ channel: 'chrome', headless: true })
  try {
    console.log('4 innovaciones → lista de siempre')
    let page = await abrir(browser, { slug: 'p4', viewport: COMPU })
    ok((await page.$('.kt-innov')) === null, 'no hay grilla')
    ok((await page.$('.kt-innov-detalle')) === null, 'no hay recuadro de detalle')
    ok((await page.$$('.kt-innov-ficha')).length === 0, 'no hay fichas de grilla')
    ok(await page.evaluate(() => /Descripción de la innovación 2./i.test(document.body.innerText) && /Descripción de la innovación 1./i.test(document.body.innerText)), "la lista muestra las descripciones completas")
    // ra VIS-004: la lista de ≤4 lee los MISMOS tokens que el recuadro (se comparan abajo, en el escenario de 20)
    const estilosLista = await page.evaluate(() => {
      const a = [...document.querySelectorAll('article')].find((x) => x.textContent.includes('Descripción de la innovación 2.'))
      const g = (e) => { const c = getComputedStyle(e); return { size: c.fontSize, lh: c.lineHeight, peso: c.fontWeight, color: c.color } }
      const [tit, txt] = a.querySelectorAll(':scope > div > span')
      return { titulo: g(tit), texto: g(txt) }
    })
    ok(estilosLista.titulo.size === '15px' && estilosLista.titulo.lh === '22.5px' && estilosLista.titulo.peso === '700', 'lista de 4: título 15px / 1.5 / 700 (tokens --innov-titulo-*)', JSON.stringify(estilosLista))
    ok(estilosLista.texto.size === '13.5px' && parseFloat(estilosLista.texto.lh).toFixed(2) === (13.5 * 1.55).toFixed(2), 'lista de 4: descripción 13.5px / 1.55 (tokens --innov-texto-*)', JSON.stringify(estilosLista))
    await page.close()

    console.log('5 innovaciones → recuadro + grilla (1 sola página, sin puntos)')
    page = await abrir(browser, { slug: 'p5', viewport: CELU })
    ok((await page.$$('.kt-innov-ficha')).length === 5, 'grilla de 5 fichas')
    ok((await page.$('.kt-innov-detalle')) !== null, 'con 5 hay recuadro de detalle')
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
    // el globo ya no existe
    ok(await page.evaluate(() => !document.querySelector('.kt-innov-globo, [role="tooltip"]')), 'sin globo: no hay .kt-innov-globo ni role=tooltip')
    ok(await page.$$eval('button.kt-innov-ficha', (bs) => bs.every((b) => !b.hasAttribute('aria-describedby') && !b.hasAttribute('aria-expanded'))), 'las fichas no llevan aria-describedby / aria-expanded del globo')
    // accesibilidad del recuadro: región con nombre y SIN región viva (joan REG-004 / ra VIS-002)
    ok(await page.$eval('.kt-innov-detalle', (d) => d.getAttribute('role') === 'region' && (d.getAttribute('aria-label') || '').length > 3 && d.id.length > 0), 'el recuadro es role=region con aria-label y un id')
    ok(await page.evaluate(() => !document.querySelector('.kt-innov [aria-live], .kt-innov [aria-atomic], .kt-innov [role="status"], .kt-innov [role="alert"], .kt-innov [role="log"]')), 'sin región viva: ni aria-live, ni aria-atomic, ni role=status/alert/log en toda la sección (no se anuncia al pasar el mouse ni se repite con teclado)')
    ok(await page.$$eval('button.kt-innov-ficha', (bs) => { const id = document.querySelector('.kt-innov-detalle').id; return bs.every((b) => b.getAttribute('aria-controls') === id && !b.hasAttribute('aria-pressed') && !b.hasAttribute('aria-label')) }), 'las fichas son botones con aria-controls hacia el recuadro, sin aria-pressed y sin aria-label (su nombre accesible es el título)')
    ok(await page.$$eval('button.kt-innov-ficha', (bs) => bs.every((b) => b.getAttribute('aria-current') === null || b.getAttribute('aria-current') === 'true')) && (await senaladas(page)).length === 1, 'la señalada lleva aria-current="true" y las demás no llevan el atributo (ra VIS-007)')
    ok(await page.$eval('.kt-innov', (c) => { const p = c.parentElement; const w = parseFloat(getComputedStyle(c).width); return getComputedStyle(c).containerType === 'inline-size' && w > 200 && Math.abs(w - c.querySelector('.kt-innov-detalle').getBoundingClientRect().width) < 1 && w <= p.getBoundingClientRect().width + 1 }), '.kt-innov es container-type: inline-size y conserva su ancho (lo que usa el @container de N2; ra VIS-001)')
    ok(await page.$eval('.kt-innov-detalle-medida', (m) => m.getAttribute('aria-hidden') === 'true' && getComputedStyle(m).visibility === 'hidden'), 'la capa que mide el alto está aria-hidden y no se ve')
    // al cargar: la primera
    const botones = await page.$$('button.kt-innov-ficha')
    {
      const d = await medirDetalle(page)
      ok((await senaladas(page)).join() === '0', 'al cargar queda señalada la primera ficha (aria-current)')
      ok(d.titulo === SKU && d.texto === 'Descripción de la innovación 1.', 'al cargar el recuadro muestra la primera', JSON.stringify(d))
      ok(d.bottom <= d.pistaTop + 0.5, 'el recuadro está ARRIBA de la grilla', JSON.stringify({ bottom: d.bottom, pistaTop: d.pistaTop }))
    }
    // medidas del mockup (las fichas y el recuadro con la inicial: la 1.ª no tiene imagen)
    {
      const m = await page.evaluate(() => {
        const color = (v) => { const e = document.createElement('i'); e.style.color = `var(${v})`; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c }
        const d = document.querySelector('.kt-innov-detalle')
        const dc = getComputedStyle(d)
        const it = getComputedStyle(d.querySelector(':scope > .kt-innov-detalle-item'))
        const tit = getComputedStyle(d.querySelector('.kt-innov-detalle-titulo'))
        const txt = getComputedStyle(d.querySelector('.kt-innov-detalle-texto'))
        const f = getComputedStyle(document.querySelector('button.kt-innov-ficha'))
        return {
          borde: dc.borderTopWidth + ' ' + dc.borderTopStyle, bordeColor: dc.borderTopColor, primary: color('--primary'), bg: dc.backgroundColor, bgToken: color('--innov-detalle-bg'),
          titLh: tit.lineHeight, titColor: tit.color, ink: color('--ink'), txtPeso: txt.fontWeight, pad: dc.paddingTop + '/' + dc.paddingLeft, gap: it.columnGap, titFs: tit.fontSize, titMay: tit.textTransform, titPeso: tit.fontWeight, txtFs: txt.fontSize, txtLh: txt.lineHeight,
          txtColor: txt.color, soft: color('--soft'), fichaFs: f.fontSize, fichaPeso: f.fontWeight, fichaMay: f.textTransform, fichaBorde: f.borderTopColor, line2: color('--line2'), minH: dc.minHeight,
        }
      })
      ok(m.borde === '1px solid' && m.bordeColor === m.primary, 'recuadro: borde de 1px en --primary', JSON.stringify(m))
      ok(m.bg === m.bgToken && m.bg === 'rgb(27, 27, 27)', 'recuadro: fondo panel2 (--innov-detalle-bg, #1b1b1b)', JSON.stringify(m))
      ok(m.pad === '16px/16px' && m.gap === '16px', 'recuadro: padding 16 y gap 16', JSON.stringify(m))
      ok(m.titFs === '15px' && m.titMay === 'uppercase' && m.titPeso === '700', 'recuadro: título de 15px en mayúsculas, peso 700', JSON.stringify(m))
      ok(m.titLh === '22.5px' && m.titColor === m.ink, 'recuadro: título con line-height 1.5 (22.5px) en --ink (ra VIS-005)', JSON.stringify(m))
      ok(m.titFs === estilosLista.titulo.size && m.titLh === estilosLista.titulo.lh && m.titPeso === estilosLista.titulo.peso && m.titColor === estilosLista.titulo.color, 'recuadro y lista de 4: el TÍTULO se ve igual (tamaño, line-height, peso y color, tokens compartidos)', JSON.stringify({ m, estilosLista }))
      ok(m.txtFs === estilosLista.texto.size && m.txtLh === estilosLista.texto.lh && m.txtColor === estilosLista.texto.color, 'recuadro y lista de 4: la DESCRIPCIÓN se ve igual (tamaño, line-height y color, tokens compartidos)', JSON.stringify({ m, estilosLista }))
      ok(m.txtFs === '13.5px' && parseFloat(m.txtLh).toFixed(2) === (13.5 * 1.55).toFixed(2) && m.txtColor === m.soft, 'recuadro: descripción de 13.5px / 1.55 en --soft', JSON.stringify(m))
      ok(m.minH === '118px', 'recuadro: piso de alto de 118px en compu (--innov-detalle-alto)', JSON.stringify(m))
      ok(['12px', '13px'].includes(m.fichaFs) && m.fichaPeso === '700' && m.fichaMay === 'uppercase', 'ficha: 12/13px, peso 700, mayúsculas', JSON.stringify(m))
      ok(m.fichaBorde === m.primary, 'la ficha señalada lleva el borde en --primary', JSON.stringify(m))
      const d0 = await medirDetalle(page)
      ok(Math.round(d0.imgW) === 84 && Math.round(d0.imgH) === 84, 'recuadro: la inicial (sin imagen) mide 84×84', JSON.stringify(d0))
    }
    // ALTO ESTABLE + señalar con el mouse: las 18 fichas, una por una
    {
      await page.mouse.move(5, 5); await espera(100)
      const d0 = await medirDetalle(page)
      const malos = []
      const alturas = new Set()
      let conImagen = null
      for (let k = 0; k < botones.length; k += 1) {
        await botones[k].hover(); await espera(80)
        const d = await medirDetalle(page)
        const sen = (await senaladas(page)).join()
        const tFicha = quitarSoft(await botones[k].$eval('.min-w-0', (e) => e.textContent))
        alturas.add(Math.round(d.h * 10))
        if (numeroDeBoton(k) === 7) conImagen = d
        if (sen !== String(k) || d.titulo !== tFicha || d.texto !== descEsperada(k) || Math.abs(d.h - d0.h) > 0.5 || Math.abs(d.pistaTop - d0.pistaTop) > 0.5 || Math.abs(d.ultTop - d0.ultTop) > 0.5 || d.desborda) {
          malos.push(`${k}: ${JSON.stringify({ sen, d, tFicha })}`)
        }
      }
      ok(malos.length === 0, 'hover: las 18 fichas se señalan al pasar el mouse, el recuadro muestra su título y descripción, y NADA se mueve ni desborda', malos[0] || '')
      ok(alturas.size === 1, 'el recuadro mide lo MISMO con cualquier ficha señalada (también con la de la descripción larguísima)', [...alturas].join())
      const larga = await page.$eval('.kt-innov-detalle-medida', (m) => Math.max(...[...m.querySelectorAll('.kt-innov-detalle-cuerpo')].map((c) => c.getBoundingClientRect().height)))
      ok(d0.h >= larga + 34 - 0.5, 'el alto cubre la descripción más larga (crece para ella desde el inicio, no al pasar el mouse)', `${d0.h} vs ${larga + 34}`)
      ok(conImagen && Math.round(conImagen.imgW) === 84 && Math.round(conImagen.imgH) === 84 && conImagen.imgEsImg && conImagen.fit === 'contain', 'recuadro: la imagen mide 84×84 con object-fit: contain', JSON.stringify(conImagen))
      ok(await page.$$eval('button.kt-innov-ficha img', (is) => is.length === 1 && is.every((i) => Math.round(i.getBoundingClientRect().width) === 44 && Math.round(i.getBoundingClientRect().height) === 44 && getComputedStyle(i).objectFit === 'contain')), 'ficha: la imagen mide 44×44 con object-fit: contain')
      ok(await page.$eval('.kt-innov-pista', (p) => [...p.querySelectorAll('.kt-innov-ficha .kt-innov-inicial')].every((i) => Math.round(i.getBoundingClientRect().width) === 44)), 'ficha sin imagen: la inicial mide 44×44')
    }
    // el que se señala por último queda aunque el mouse se vaya; la ficha lleva el borde en --primary y las otras no
    // el recuadro va clavado arriba: una ficha puede estar «en pantalla» pero tapada por él; se la lleva a donde se ve (scroll-margin-top)
    await botones[2].evaluate((e) => e.scrollIntoView({ block: 'nearest' })); await espera(100)
    await botones[2].hover(); await espera(150)
    ok((await senaladas(page)).join() === '2', 'hover en la 5.ª innovación la señala (una sola señalada)')
    await page.mouse.move(5, 5); await espera(250)
    ok((await senaladas(page)).join() === '2' && /innovación 5\./.test((await medirDetalle(page)).texto), 'sacar el mouse deja señalada la última (el recuadro no se vacía)')
    ok(await page.evaluate(() => {
      const prim = (() => { const e = document.createElement('i'); e.style.color = 'var(--primary)'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c })()
      const bs = [...document.querySelectorAll('button.kt-innov-ficha')]
      return bs.every((b, i) => (getComputedStyle(b).borderTopColor === prim) === (i === 2))
    }), 'sólo la señalada lleva el borde en --primary (con el mouse afuera)')
    // click SIN foco ni puntero (joan REG-001): señala igual
    {
      const conFoco = await clickSinFoco(botones[5]); await espera(150)
      ok(!conFoco && (await senaladas(page)).join() === '5', 'click despachado sin foco señala la ficha (no depende de onFocus)', JSON.stringify(await senaladas(page)))
    }
    // teclado
    await page.keyboard.press('Shift')
    await page.$eval('button.kt-innov-ficha', (b) => b.focus()); await espera(200)
    ok((await senaladas(page)).join() === '0' && (await medirDetalle(page)).titulo === SKU, 'foco de teclado señala esa ficha y el recuadro la muestra')
    await page.keyboard.press('Escape'); await espera(150)
    ok((await senaladas(page)).join() === '0', 'Escape no hace nada (ya no hay nada que cerrar)')
    await page.keyboard.press('Tab'); await espera(200)
    ok((await senaladas(page)).join() === '1' && (await medirDetalle(page)).texto === 'Descripción de la innovación 2.', 'Tab pasa a la siguiente ficha y el recuadro la muestra')
    // idioma: el contenido es español
    ok(await page.$$eval('.kt-innov-ficha .min-w-0, .kt-innov-detalle-titulo, .kt-innov-detalle-texto', (ts) => ts.every((t) => t.lang === 'es')), 'títulos de fichas y título y texto del recuadro con lang="es"')
    await page.mouse.move(5, 5)
    await page.close()

    console.log('N2 · recuadro angosto (contenedor a 232px, como la ficha en un notebook de 1024)')
    page = await abrir(browser, { slug: 'p20', viewport: COMPU })
    {
      const medirN2 = () => page.evaluate(() => {
        const d = document.querySelector('.kt-innov-detalle')
        const v = d.querySelector(':scope > .kt-innov-detalle-item')
        const img = v.querySelector('img, .kt-innov-inicial').getBoundingClientRect()
        const tit = v.querySelector('.kt-innov-detalle-titulo').getBoundingClientRect()
        const txt = v.querySelector('.kt-innov-detalle-texto').getBoundingClientRect()
        const dr = d.getBoundingClientRect()
        const cs = getComputedStyle(d)
        const padL = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)
        const padR = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth)
        return {
          cont: Math.round(document.querySelector('.kt-innov').getBoundingClientRect().width),
          imgW: Math.round(img.width), imgH: Math.round(img.height), gap: Math.round(tit.left - img.right),
          centrados: Math.abs((img.top + img.height / 2) - (tit.top + tit.height / 2)) <= 1,
          txtDebajo: txt.top >= Math.max(img.bottom, tit.bottom) - 0.5, txtMargen: Math.round(txt.top - Math.max(img.bottom, tit.bottom)),
          txtAncho: Math.round(txt.width), interior: Math.round(dr.width - padL - padR), desborda: d.scrollWidth > d.clientWidth + 1,
        }
      })
      const ancha = await medirN2()
      ok(ancha.cont > 250 && ancha.imgW === 84 && ancha.txtAncho < ancha.interior - 84, 'contenedor ancho (1440): sigue C1, imagen de 84 y texto al lado', JSON.stringify(ancha))
      await page.$eval('.kt-innov', (e) => { e.style.width = '232px' }); await espera(200)
      const a = await medirN2()
      ok(a.cont === 232 && a.imgW === 48 && a.imgH === 48, 'N2: con el contenedor a 232px la imagen mide 48×48', JSON.stringify(a))
      ok(a.gap === 12 && a.centrados, 'N2: la imagen y el título van lado a lado, gap 12, centrados en vertical', JSON.stringify(a))
      ok(a.txtDebajo && a.txtAncho === a.interior && a.txtMargen === 6, 'N2: la descripción va debajo, a todo el ancho del recuadro, margin-top 6', JSON.stringify(a))
      ok(!a.desborda, 'N2: nada desborda el recuadro', JSON.stringify(a))
      await page.$eval('.kt-innov', (e) => { e.style.width = '250px' }); await espera(200)
      ok((await medirN2()).imgW === 48, 'N2: el corte incluye 250px (imagen de 48)')
      await page.$eval('.kt-innov', (e) => { e.style.width = '251px' }); await espera(200)
      ok((await medirN2()).imgW === 84, 'N2: a 251px ya es C1 (imagen de 84)')
    }
    await page.close()

    console.log('Ficha apilada en celular angosto (nombres reales)')
    // por cada ficha: dónde está la imagen respecto del nombre, cuántos renglones ocupa el título y si alguna palabra se partió sin guion
    const fichasReales = (pg) => pg.evaluate(() => {
      const malas = []
      const filas = []
      for (const f of document.querySelectorAll('.kt-innov-pagina:nth-child(1) .kt-innov-ficha')) {
        const t = f.querySelector('.kt-innov-nombre')
        const img = f.querySelector('img, .kt-innov-inicial').getBoundingClientRect()
        const tr = t.getBoundingClientRect()
        const fr = f.getBoundingClientRect()
        const cs = getComputedStyle(f)
        const interior = fr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2
        const lh = parseFloat(getComputedStyle(t).lineHeight)
        const renglones = Math.round(tr.height / lh)
        for (const m of t.textContent.matchAll(/\S+/g)) {
          const r = document.createRange()
          r.setStart(t.firstChild, m.index)
          r.setEnd(t.firstChild, m.index + m[0].length)
          const lineas = new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size
          if (lineas > 1 && !m[0].includes('­')) malas.push(m[0])
        }
        filas.push({
          nombre: t.textContent.replace(/­/g, ''), renglones,
          arriba: img.bottom <= tr.top + 0.5 && Math.abs((img.left + img.width / 2) - (fr.left + fr.width / 2)) <= 1,
          gap: Math.round(tr.top - img.bottom), alLado: img.right <= tr.left + 0.5,
          imgW: Math.round(img.width), nombreAncho: Math.round(tr.width), interior: Math.round(interior), centrado: getComputedStyle(t).textAlign,
        })
      }
      return { malas, filas, ficha: Math.round(document.querySelector('.kt-innov-pagina .kt-innov-ficha').getBoundingClientRect().width) }
    })
    page = await abrir(browser, { slug: 'real9', viewport: { ...CELU, width: 320, height: 700 } })
    {
      const r = await fichasReales(page)
      ok(r.malas.length === 0, '320 con nombres reales: ninguna palabra del título se parte sin guion', JSON.stringify(r.malas) + ' ficha ' + r.ficha + 'px')
      ok(r.filas.every((f) => f.renglones <= 3), '320 con nombres reales: ningún título pasa de 3 renglones', JSON.stringify(r.filas.map((f) => [f.nombre, f.renglones])))
      ok(r.filas.every((f) => f.arriba && f.imgW === 44 && Math.abs(f.gap - 8) <= 1 && !f.alLado), '320: la ficha es angosta y apila la imagen (44) arriba del nombre, centrada, con gap 8', JSON.stringify(r.filas[0]))
      ok(r.filas.every((f) => Math.abs(f.nombreAncho - f.interior) <= 1 && f.centrado === 'center'), '320: el nombre va centrado y a todo el ancho de la ficha', JSON.stringify(r.filas[0]))
    }
    await page.close()
    // VIS-008: las imágenes de una misma fila a la misma altura, a 320, 360 y 375
    for (const w of [320, 360, 375]) {
      page = await abrir(browser, { slug: 'real9', viewport: { ...CELU, width: w, height: 800 } })
      const r = await page.evaluate(() => {
        const filas = new Map()
        for (const f of document.querySelectorAll('.kt-innov-pagina:nth-child(1) .kt-innov-ficha')) {
          const k = Math.round(f.getBoundingClientRect().top)
          const img = f.querySelector('img, .kt-innov-inicial').getBoundingClientRect().top
          filas.set(k, [...(filas.get(k) || []), img])
        }
        const apilada = getComputedStyle(document.querySelector('.kt-innov-ficha')).flexDirection === 'column'
        const mixto = [...document.querySelectorAll('.kt-innov-pagina:nth-child(1) .kt-innov-ficha')].map((f) => Math.round(f.querySelector('.kt-innov-nombre').getBoundingClientRect().height))
        return { filas: [...filas.values()], apilada, alturasDeNombre: mixto }
      })
      ok(r.apilada && r.filas.length >= 2 && r.filas.every((t) => Math.max(...t) - Math.min(...t) <= 1), `${w}: ficha apilada y las imágenes de cada fila (${r.filas.length} filas) a la misma altura`, JSON.stringify(r))
      await page.close()
    }
    page = await abrir(browser, { slug: 'real9', viewport: CELU })
    {
      ok(await page.$eval('.kt-innov-detalle', (d) => getComputedStyle(d).position !== 'sticky'), '390: el recuadro NO es sticky en celular')
    }
    await page.close()
    page = await abrir(browser, { slug: 'real9', viewport: CELU })
    {
      const r = await fichasReales(page)
      ok(r.filas.every((f) => f.alLado && !f.arriba && f.imgW === 44) && r.ficha > 150, '390: las fichas (~152px) siguen con la imagen al lado del nombre', JSON.stringify({ ficha: r.ficha, f0: r.filas[0] }))
      ok(r.malas.length === 0, '390 con nombres reales: ninguna palabra del título se parte sin guion', JSON.stringify(r.malas))
    }
    await page.close()

    console.log('Compu 1024 (columna de 232px): ficha con imagen al lado y recuadro clavado')
    page = await abrir(browser, { slug: 'real9', viewport: { width: 1024, height: 768 } })
    {
      const r = await fichasReales(page)
      ok(r.filas.length === 6 && r.filas.every((f) => f.alLado && !f.arriba && f.imgW === 44), '1024: fichas con la imagen AL LADO del nombre (no apiladas: el apilado es sólo de celular)', JSON.stringify({ n: r.filas.length, f0: r.filas[0] }))
      ok(await page.$eval('.kt-innov', (e) => Math.round(e.getBoundingClientRect().width)) < 338, '1024: el contenedor es angosto (<338px), o sea el caso de REG-005')
      ok(await page.$eval('.kt-innov-detalle', (d) => getComputedStyle(d).position === 'sticky'), '1024: el recuadro es position: sticky')
      ok(await page.evaluate(() => { const h = document.querySelector('.kt-innov-detalle').getBoundingClientRect().height; return parseFloat(getComputedStyle(document.querySelector('.kt-innov-ficha')).scrollMarginTop) >= parseFloat(getComputedStyle(document.querySelector('.kt-innov-detalle')).top) + h }), '1024: las fichas llevan scroll-margin-top mayor que el alto del recuadro clavado (el foco no queda tapado)')
      const botones = await page.$$('button.kt-innov-ficha')
      await botones[botones.length - 1].hover(); await espera(300)
      const m = await page.evaluate(() => {
        const d = document.querySelector('.kt-innov-detalle')
        const t = d.querySelector(':scope > .kt-innov-detalle-item .kt-innov-detalle-titulo').getBoundingClientRect()
        const barras = [...document.querySelectorAll('.site-header, [data-kt-detail-nav]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0)
        const finBarras = Math.max(...barras.map((r) => r.bottom))
        const f = [...document.querySelectorAll('button.kt-innov-ficha')].pop().getBoundingClientRect()
        return { titulo: d.querySelector(':scope > .kt-innov-detalle-item .kt-innov-detalle-titulo').textContent.replace(/­/g, ''), tTop: Math.round(t.top), tBottom: Math.round(t.bottom), finBarras: Math.round(finBarras), alto: innerHeight, scroll: Math.round(scrollY), fichaTop: Math.round(f.top), panelBottom: Math.round(d.getBoundingClientRect().bottom), barras: barras.length }
      })
      ok(m.titulo === 'COMPATIBILIDAD' && m.scroll > 0, '1024×768, mouse sobre la ficha 9: se señala COMPATIBILIDAD y la página bajó hasta ella', JSON.stringify(m))
      ok(m.tTop >= m.finBarras && m.tBottom <= m.alto && m.fichaTop >= m.panelBottom, '1024×768, mouse sobre la ficha 9: el título del recuadro está dentro de la ventana, debajo de la cabecera y las pestañas, y sin tapar la ficha', JSON.stringify(m))
    }
    await page.close()

    console.log('Recuadro clavado sólo cuando hace falta (1440×900, 9 reales)')
    page = await abrir(browser, { slug: 'real9', viewport: COMPU })
    {
      const m = await page.evaluate(() => {
        const raiz = document.querySelector('.kt-innov')
        const ult = [...document.querySelectorAll('.kt-innov-ficha')].pop().getBoundingClientRect()
        const pista = getComputedStyle(document.querySelector('.kt-innov-pista'))
        return { clase: raiz.classList.contains('kt-innov--clavable'), pos: getComputedStyle(document.querySelector('.kt-innov-detalle')).position, vacio: Math.round(raiz.getBoundingClientRect().bottom - ult.bottom), padding: pista.paddingBottom }
      })
      ok(!m.clase && m.pos !== 'sticky' && m.vacio <= 12 && m.padding === '0px', '1440×900 con las 9 reales: sin clase kt-innov--clavable, sin sticky y sin vacío (la última ficha a ≤12px del final)', JSON.stringify(m))
    }
    await page.close()

    console.log('Clase clavable al cargar, sin resize (1280 de ancho)')
    {
      // alto de ventana exacto para que la grilla necesite clavarse con la barra ya medida (top 133) pero NO con el top inicial (80)
      page = await abrir(browser, { slug: 'real9', viewport: { width: 1280, height: 900 } })
      const necesario = await page.evaluate(() => {
        const alto = Math.ceil(parseFloat(getComputedStyle(document.querySelector('.kt-innov-detalle')).height))
        const pista = document.querySelector('.kt-innov-pista')
        return alto + 12 + pista.offsetHeight - parseFloat(getComputedStyle(pista).paddingBottom)
      })
      await page.close()
      const alta = Math.round(necesario + 100) // top 133: necesario > alta - 133; top 80: necesario <= alta - 80
      page = await abrir(browser, { slug: 'real9', viewport: { width: 1280, height: alta } })
      const r = await page.evaluate(() => ({ clase: document.querySelector('.kt-innov').classList.contains('kt-innov--clavable'), top: getComputedStyle(document.querySelector('.kt-detail-page')).getPropertyValue('--kt-detail-top'), alto: innerHeight }))
      ok(r.clase && parseFloat(r.top) > 100, '1280×' + alta + ' recién cargado, sin resize: ya lleva kt-innov--clavable (se recalculó con la barra de secciones medida)', JSON.stringify({ r, necesario }))
      await page.close()
    }

    console.log('Recuadro clavado: franja, final de la grilla, alto publicado y rueda (1024×768)')
    page = await abrir(browser, { slug: 'real9', viewport: { width: 1024, height: 768 } })
    {
      ok(await page.$eval('.kt-innov', (e) => e.classList.contains('kt-innov--clavable')), '1024×768: la grilla y el recuadro no entran en la ventana → clase kt-innov--clavable')
      const geom = await page.evaluate(() => { const c = document.querySelector('.kt-innov').getBoundingClientRect(); return { top: c.top + scrollY, bottom: c.bottom + scrollY } })
      // franja entre la barra y el recuadro: lo que está ARRIBA de todo en ese punto no puede ser una ficha
      const franja = () => page.evaluate(() => {
        const d = document.querySelector('.kt-innov-detalle').getBoundingClientRect()
        const barra = Math.max(...[...document.querySelectorAll('.site-header, [data-kt-detail-nav]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0).map((r) => r.bottom))
        const clavado = Math.abs(d.top - parseFloat(getComputedStyle(document.querySelector('.kt-innov-detalle')).top)) < 1.5
        const y = barra + (d.top - barra) / 2
        const malos = [0.1, 0.3, 0.5, 0.7, 0.9].map((k) => document.elementsFromPoint(d.left + d.width * k, y)[0]).filter((e) => e && e.closest('.kt-innov-ficha'))
        // lo que está arriba de todo en la franja es el recuadro (su ::before), y ese ::before tiene fondo OPACO (no deja ver las fichas)
        const pseudo = getComputedStyle(document.querySelector('.kt-innov-detalle'), '::before')
        const opaco = pseudo.content !== 'none' && (pseudo.backgroundImage.includes('gradient') ? !/rgba|transparent/.test(pseudo.backgroundImage) : !/rgba\(.*, 0\)|transparent/.test(pseudo.backgroundColor))
        return { clavado, ancho: Math.round(d.top - barra), malos: malos.length, opaco }
      })
      let clavados = 0
      const malosEn = []
      for (let s = geom.top + 40; s < geom.bottom - 340; s += 90) {
        await page.evaluate((y) => scrollTo(0, y), s); await espera(60)
        const r = await franja()
        if (r.clavado) { clavados += 1; if (r.malos || r.ancho < 10 || !r.opaco) malosEn.push({ s, ...r }) }
      }
      ok(clavados >= 4 && malosEn.length === 0, `franja entre la barra y el recuadro: tapada en ${clavados} pasos de scroll clavado (ninguna ficha arriba de todo)`, JSON.stringify(malosEn.slice(0, 2)))
      // al final de la grilla
      // 600: el recuadro sigue clavado y la última ficha libre debajo; 250 y 200: el recuadro ya se SOLTÓ (se apoya en el fondo del contenedor)
      for (const abajo of [600, 250, 200]) {
        await page.evaluate((y) => scrollTo(0, y), geom.bottom - abajo); await espera(120)
        const f = await page.evaluate(() => {
          const d = document.querySelector('.kt-innov-detalle').getBoundingClientRect()
          const ult = [...document.querySelectorAll('button.kt-innov-ficha')].pop()
          const r = ult.getBoundingClientRect()
          const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          const barra = Math.max(...[...document.querySelectorAll('.site-header, [data-kt-detail-nav]')].map((e) => e.getBoundingClientRect()).filter((q) => q.height > 0).map((q) => q.bottom))
          const sinPisar = r.top >= d.bottom - 0.5 || r.bottom <= d.top + 0.5
          const aLaVista = r.top >= barra && r.bottom <= innerHeight
          return { fichaTop: Math.round(r.top * 10) / 10, fichaBottom: Math.round(r.bottom * 10) / 10, panelTop: Math.round(d.top * 10) / 10, panelBottom: Math.round(d.bottom * 10) / 10, sinPisar, aLaVista, entera: !aLaVista || (!!arriba && ult.contains(arriba) && document.elementFromPoint(r.left + r.width / 2, r.bottom - 1)?.closest('.kt-innov-ficha') === ult) }
        })
        ok(f.sinPisar && f.entera, `final de la grilla (contenedor a ${abajo}px del tope): la última ficha queda entera y el recuadro (clavado o ya suelto) no la pisa`, JSON.stringify(f))
      }
      // --innov-detalle-h = alto del recuadro redondeado hacia arriba
      const h = await page.evaluate(() => ({ pub: parseFloat(document.querySelector('.kt-innov').style.getPropertyValue('--innov-detalle-h')), real: parseFloat(getComputedStyle(document.querySelector('.kt-innov-detalle')).height) }))
      ok(h.pub === Math.ceil(h.real) && h.pub >= h.real, '--innov-detalle-h publica el alto del recuadro redondeado hacia arriba', JSON.stringify(h))
      // rueda con el puntero quieto
      await page.evaluate((y) => scrollTo(0, y), geom.top + 250); await espera(200)
      const bs = await page.$$('button.kt-innov-ficha')
      // la ficha 4 más abajo del recuadro clavado, para que el puntero no quede sobre él cuando la rueda deslice la página
      await bs[3].evaluate((e) => scrollBy(0, e.getBoundingClientRect().top - 520)); await espera(200)
      const caja = await bs[3].boundingBox()
      const x = caja.x + caja.width / 2
      const y = caja.y + caja.height / 2
      await page.mouse.move(x - 40, y - 5); await page.mouse.move(x, y); await espera(200)
      const antes = await senaladas(page)
      await page.mouse.wheel({ deltaY: 152 }); await espera(500)
      const despues = await senaladas(page)
      const debajo = await page.evaluate(([px, py]) => [...document.querySelectorAll('button.kt-innov-ficha')].findIndex((b) => b.contains(document.elementFromPoint(px, py))), [x, y])
      ok(antes.join() === '3' && despues.join() === '3' && debajo !== 3 && debajo >= 0, 'rueda con el puntero quieto: pasa otra ficha por debajo del puntero y la señalada NO cambia', JSON.stringify({ antes, despues, debajo }))
      await page.mouse.move(x + 3, y + 2); await espera(200)
      ok((await senaladas(page)).join() === String(debajo), 'y al mover el puntero se señala la que tiene debajo', JSON.stringify(await senaladas(page)))
    }
    await page.close()

    console.log('Re-medido del alto publicado, sin ResizeObserver (1024×768)')
    page = await abrir(browser, {
      slug: 'real9', viewport: { width: 1024, height: 768 },
      antes: () => {
        // el ResizeObserver no avisa nada: lo único que puede actualizar el alto publicado es el re-medido
        window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
        // document.fonts.ready lo resuelve el check cuando quiere
        const ready = new Promise((r) => { window.__resolverFuentes = r })
        Object.defineProperty(document, 'fonts', { configurable: true, value: { ready, load: () => Promise.resolve([]), check: () => true, addEventListener() {}, removeEventListener() {} } })
      },
    })
    {
      const publicado = () => page.evaluate(() => ({ pub: parseFloat(document.querySelector('.kt-innov').style.getPropertyValue('--innov-detalle-h')), real: parseFloat(getComputedStyle(document.querySelector('.kt-innov-detalle')).height) }))
      const inicial = await publicado()
      ok(inicial.pub === Math.ceil(inicial.real), 'al montar: el alto publicado es el techo del alto real', JSON.stringify(inicial))
      // 1) cambio de menos de 1px y llega «la fuente»: document.fonts.ready
      const alto1 = Math.ceil(inicial.real) + 0.3 // fracción < 0,5: ceil sube 1, round no
      await page.$eval('.kt-innov-detalle', (e, h) => { e.style.minHeight = `${h}px` }, alto1); await espera(200)
      const sinAviso = await publicado()
      ok(sinAviso.pub === inicial.pub && sinAviso.real > inicial.real && Math.abs(sinAviso.real - alto1) < 0.05, 'el alto del recuadro cambió y, sin re-medido, lo publicado queda viejo (el ResizeObserver no interviene)', JSON.stringify({ inicial, sinAviso }))
      await page.evaluate(() => window.__resolverFuentes()); await espera(200)
      const conFuentes = await publicado()
      ok(conFuentes.pub === Math.ceil(conFuentes.real) && conFuentes.pub === Math.ceil(alto1), 'al resolverse document.fonts.ready se re-mide: lo publicado es el techo del alto real (fracción <,5: ceil ≠ round)', JSON.stringify(conFuentes))
      // 2) otro cambio y llega el evento `load`
      const alto2 = Math.ceil(alto1) + 2.2
      await page.$eval('.kt-innov-detalle', (e, h) => { e.style.minHeight = `${h}px` }, alto2); await espera(200)
      const antesLoad = await publicado()
      await page.evaluate(() => window.dispatchEvent(new Event('load'))); await espera(200)
      const trasLoad = await publicado()
      ok(antesLoad.pub === conFuentes.pub && trasLoad.pub === Math.ceil(trasLoad.real) && trasLoad.pub === Math.ceil(alto2), 'un `load` posterior también re-mide: lo publicado es el techo del alto real', JSON.stringify({ antesLoad, trasLoad }))
    }
    await page.close()

    console.log('Filtro de coordenadas del pointermove (1024×768)')
    page = await abrir(browser, { slug: 'real9', viewport: { width: 1024, height: 768 } })
    {
      const geom = await page.evaluate(() => { const c = document.querySelector('.kt-innov').getBoundingClientRect(); return { top: c.top + scrollY } })
      await page.evaluate((y) => scrollTo(0, y), geom.top + 250); await espera(200)
      const bs = await page.$$('button.kt-innov-ficha')
      await bs[3].evaluate((e) => scrollBy(0, e.getBoundingClientRect().top - 520)); await espera(200)
      const caja = await bs[3].boundingBox()
      const x = caja.x + caja.width / 2
      const y = caja.y + caja.height / 2
      await page.mouse.move(x - 40, y - 5); await page.mouse.move(x, y); await espera(200)
      ok((await senaladas(page)).join() === '3', 'el puntero real señala la ficha 4')
      // la página se desliza (otra ficha queda bajo el puntero) SIN que el puntero se mueva
      await page.evaluate(() => scrollBy(0, 152)); await espera(300)
      const debajo = await page.evaluate(([px, py]) => [...document.querySelectorAll('button.kt-innov-ficha')].findIndex((b) => b.contains(document.elementFromPoint(px, py))), [x, y])
      // pointermove sintético con LAS MISMAS coordenadas que el anterior, sobre la ficha que quedó abajo: se ignora
      const mover = (px, py) => page.evaluate(([cx, cy]) => {
        const b = document.elementFromPoint(cx, cy)
        b.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: cx, clientY: cy, bubbles: true, cancelable: true }))
      }, [px, py])
      await mover(x, y); await espera(200)
      ok(debajo >= 0 && debajo !== 3 && (await senaladas(page)).join() === '3', 'pointermove con las MISMAS coordenadas, con otra ficha bajo el puntero: la señalada NO cambia', JSON.stringify({ debajo, senaladas: await senaladas(page) }))
      await mover(x + 1, y); await espera(200)
      ok((await senaladas(page)).join() === String(debajo), 'pointermove con OTRAS coordenadas: se señala la que está debajo', JSON.stringify(await senaladas(page)))
    }
    await page.close()

    console.log('N2 no se activa en celular: 320 de ancho (contenedor de 272px) queda en C1')
    page = await abrir(browser, { slug: 'p13', viewport: { ...CELU, width: 320, height: 700 } })
    {
      const r = await page.evaluate(() => {
        const d = document.querySelector('.kt-innov-detalle')
        const v = d.querySelector(':scope > .kt-innov-detalle-item')
        const img = v.querySelector('img, .kt-innov-inicial').getBoundingClientRect()
        const txt = v.querySelector('.kt-innov-detalle-texto').getBoundingClientRect()
        return { cont: Math.round(document.querySelector('.kt-innov').getBoundingClientRect().width), imgW: Math.round(img.width), textoAlLado: txt.left >= img.right && txt.top < img.bottom }
      })
      ok(r.cont > 250 && r.imgW === 84 && r.textoAlLado, 'celular de 320: C1 (imagen de 84 y texto al lado), no N2', JSON.stringify(r))
    }
    await page.close()

    console.log('Silabeo en el recuadro (1440, 20 innovaciones)')
    page = await abrir(browser, { slug: 'p20', viewport: COMPU })
    {
      const bs = await page.$$('button.kt-innov-ficha')
      await bs[1].hover(); await espera(150)
      const ok1 = await page.$eval('.kt-innov-detalle-item .kt-innov-detalle-titulo', (e) => e.textContent.includes('RE­FRI­GE­RA­CIÓN'))
      ok(ok1, 'el título del recuadro lleva guiones suaves (conGuiones): «REFRIGERACIÓN» silabeada')
    }
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
    {
      const d = await medirDetalle(page)
      ok((await senaladas(page)).join() === '0' && d.titulo === SKU, 'celular: al cargar queda señalada la primera y el recuadro la muestra', JSON.stringify(d))
      ok(await page.evaluate(() => {
        const d = document.querySelector('.kt-innov-detalle').getBoundingClientRect()
        const p = document.querySelector('.kt-innov-pista').getBoundingClientRect()
        const c = document.querySelector('.kt-innov').getBoundingClientRect()
        return d.bottom <= p.top + 0.5 && Math.abs(d.width - c.width) < 1
      }), 'celular: el recuadro está arriba del carrusel y ocupa todo el ancho de la columna')
      ok(await page.$eval('.kt-innov-detalle', (e) => getComputedStyle(e).minHeight === '118px'), 'celular: sólo el piso estructural de 118px (sin el 164 de antes; la capa de medida cubre el alto, ra VIS-003)')
      ok(await page.evaluate(() => { const d = document.querySelector('.kt-innov-detalle'); const larga = Math.max(...[...d.querySelectorAll('.kt-innov-detalle-medida .kt-innov-detalle-cuerpo')].map((c) => c.getBoundingClientRect().height)); return d.getBoundingClientRect().height >= larga + 34 - 0.5 }), 'celular: el alto cubre la descripción más larga (lo da la capa de medida, no un piso a mano)')
      ok(Math.round(d.imgW) === 84 && d.desborda === false, 'celular: imagen de 84px y nada desborda el recuadro', JSON.stringify(d))
    }
    {
      const d0 = await medirDetalle(page)
      await bots[1].tap(); await espera(200)
      const d1 = await medirDetalle(page)
      ok((await senaladas(page)).join() === '1' && d1.texto === descEsperada(1), 'tocar una ficha la señala y el recuadro la muestra')
      await bots[0].tap(); await espera(200)
      ok((await senaladas(page)).join() === '0', 'tocar otra: una sola señalada')
      await bots[0].tap(); await espera(200)
      ok((await senaladas(page)).join() === '0' && (await medirDetalle(page)).titulo === SKU, 'tocar de nuevo la misma la deja señalada (no se cierra)')
      // joan REG-001: en iOS Safari tocar no da foco; el click solo tiene que señalar
      const conFoco = await clickSinFoco(bots[1]); await espera(150)
      ok(!conFoco && (await senaladas(page)).join() === '1' && (await medirDetalle(page)).texto === descEsperada(1), 'celular: un click SIN foco (como iOS Safari) señala la ficha y el recuadro la muestra', JSON.stringify(await senaladas(page)))
      await bots[0].tap(); await espera(150)
      const d2 = await medirDetalle(page)
      const malos = []
      for (const k of [1, 2, 3]) {
        // 4 botones en la página 1 (las innovaciones 3.ª y 4.ª no son botón): 0, 1, 4 y 5
        const b = (await page.$$('.kt-innov-pagina:nth-child(1) button.kt-innov-ficha'))[k]
        await b.tap(); await espera(150)
        const d = await medirDetalle(page)
        if (Math.abs(d.h - d0.h) > 0.5 || Math.abs(d.pistaTop - d0.pistaTop) > 0.5 || Math.abs(d.ultTop - d0.ultTop) > 0.5) malos.push(JSON.stringify({ k, d, d0 }))
      }
      ok(malos.length === 0 && Math.abs(d2.h - d0.h) < 0.5, 'celular: tocar fichas distintas no cambia el alto del recuadro ni mueve el carrusel', malos[0] || '')
    }
    await pagina1[2].tap(); await pagina1[3].tap(); await espera(200)
    ok((await senaladas(page)).length === 1, 'tocar la ficha sin descripción / de sólo espacios no cambia la señalada')
    await bots[0].tap(); await irAPagina(page, 1)
    ok((await contador(page)) === '2 / 3', 'deslizar a la página 2 → «2 / 3»')
    ok((await senaladas(page)).join() === '4' && (await medirDetalle(page)).texto === descEsperada(4), 'cambiar de página señala la primera ficha CON descripción de la página nueva (la innovación 7) y el recuadro la muestra')
    ok(await page.$$eval('.kt-innov-punto', (ps) => ps.map((p) => p.getAttribute('aria-current')).join()) === 'false,true,false', 'el punto activo sigue al scroll')
    await irAPagina(page, 2)
    ok((await contador(page)) === '3 / 3', 'última página → «3 / 3»')
    ok((await senaladas(page)).join() === '10' && (await medirDetalle(page)).texto === descEsperada(10), 'última página: queda señalada su primera ficha (la innovación 13)')
    await (await page.$$('.kt-innov-punto'))[0].tap(); await espera(900)
    ok((await contador(page)) === '1 / 3', 'tocar el punto 1 lleva a la página 1')
    ok((await senaladas(page)).join() === '0', 'volver a la página 1 señala su primera ficha')
    // Tab hacia una ficha de otra página desplaza la pista y la señala
    await page.keyboard.press('Shift')
    await page.evaluate(() => { const fs = document.querySelectorAll('.kt-innov-pagina:nth-child(1) button.kt-innov-ficha'); fs[fs.length - 1].focus() })
    await page.keyboard.press('Tab'); await espera(1000)
    ok((await contador(page)) === '2 / 3', 'Tab a una ficha de la página 2 desplaza el carrusel')
    ok((await senaladas(page)).length === 1 && (await senaladas(page))[0] === 4 + 0, 'y la señala (el recuadro muestra la 1.ª ficha de la página 2)', JSON.stringify(await senaladas(page)))
    // el foco manda: una ficha NO primera de otra página queda señalada (el cambio de página no la pisa con la primera)
    await (await page.$$('.kt-innov-punto'))[2].tap(); await espera(900)
    await page.keyboard.press('Shift')
    await page.evaluate(() => { document.querySelectorAll('button.kt-innov-ficha')[6].focus() }); await espera(1000)
    ok((await contador(page)) === '2 / 3' && (await senaladas(page)).join() === '6', 'foco en una ficha que no es la primera de la página 2: queda ella señalada, no la primera de la página', JSON.stringify({ c: await contador(page), s: await senaladas(page) }))
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

    console.log('Imagen rota (404) → la inicial, en la ficha y en el recuadro')
    for (const [nombre, viewport] of [['1440', COMPU], ['390', CELU]]) {
      page = await abrir(browser, { slug: 'roto', viewport })
      await page.$eval('button.kt-innov-ficha', (b) => b.scrollIntoView({ block: 'center' })); await espera(1200)
      const r = await page.evaluate(() => {
        const ficha = document.querySelector('.kt-innov-ficha')
        const vis = document.querySelector('.kt-innov-detalle > .kt-innov-detalle-item')
        const info = (e) => { const i = e.querySelector('img'); const s = e.querySelector('.kt-innov-inicial'); return { img: !!i, inicial: s ? s.textContent : null, w: s ? Math.round(s.getBoundingClientRect().width) : null } }
        return { ficha: info(ficha), detalle: info(vis) }
      })
      ok(!r.ficha.img && r.ficha.inicial === 'R' && r.ficha.w === 44, `${nombre}: ficha con imagen 404 → la inicial «R» de 44×44, sin <img> roto`, JSON.stringify(r))
      ok(!r.detalle.img && r.detalle.inicial === 'R' && r.detalle.w === 84, `${nombre}: recuadro con imagen 404 → la inicial «R» de 84×84, sin <img> roto`, JSON.stringify(r))
      await page.close()
    }

    console.log('Ninguna innovación con descripción → sin recuadro, el texto sólo cuenta')
    page = await abrir(browser, { slug: 'sd13', viewport: COMPU })
    {
      const h = await hint(page)
      ok((await page.$('.kt-innov-detalle')) === null, '1440: sin recuadro')
      ok((await page.$$('button.kt-innov-ficha')).length === 0 && (await page.$$('.kt-innov-ficha')).length === 13, '1440: 13 fichas, ninguna es botón')
      ok(h.trim() === '13 innovaciones', '1440: el texto es sólo «13 innovaciones» (no promete mouse ni detalle)', JSON.stringify(h))
    }
    await page.close()
    page = await abrir(browser, { slug: 'sd13', viewport: CELU })
    {
      const h = await hint(page)
      ok((await page.$('.kt-innov-detalle')) === null, '390: sin recuadro')
      ok(h.trim() === '13 innovaciones · deslizá para ver más' && !/tocá|detalle|mouse/.test(h), '390: el texto sólo cuenta e invita a deslizar (no dice «tocá» ni «detalle»)', JSON.stringify(h))
    }
    await page.close()
    page = await abrir(browser, { slug: 'sd13', viewport: TABLET })
    {
      const h = await hint(page)
      ok(h.trim() === '13 innovaciones', '820 táctil: el texto es sólo «13 innovaciones»', JSON.stringify(h))
    }
    await page.close()

    console.log('Tablet táctil 820px')
    page = await abrir(browser, { slug: 'p13', viewport: TABLET })
    const hTab = await hint(page)
    ok(!/mouse/.test(hTab) && /tocá/.test(hTab) && !/deslizá/.test(hTab), 'grilla sin carrusel y sin «pasá el mouse»', hTab)
    {
      const bs = await page.$$('button.kt-innov-ficha')
      await bs[1].tap(); await espera(200)
      ok((await senaladas(page)).join() === '1', 'tablet: tocar señala')
    }
    await page.close()

    console.log('Idioma EN')
    page = await abrir(browser, { slug: 'p13', viewport: COMPU, lang: 'en' })
    ok(/13 innovations · hover to see the detail/.test(await hint(page)), 'compu: texto en inglés')
    ok(await page.$eval('.kt-innov', (r) => r.getAttribute('lang') === 'en'), 'EN: el contenedor lleva lang="en" (hyphens:auto usa el idioma correcto)')
    ok(await page.$$eval('.kt-innov-ficha .min-w-0', (ts) => ts.every((t) => t.lang === 'es')), 'EN: el título de la ficha es contenido en español (lang="es") aunque la página esté en inglés')
    ok(await page.$eval('.kt-innov-detalle', (d) => d.getAttribute('aria-label') === 'Innovation detail'), 'EN: la región del recuadro se llama «Innovation detail»')
    ok(await page.$eval('.kt-innov-detalle-titulo', (e) => e.lang === 'es') && await page.$eval('.kt-innov-detalle-texto', (e) => e.lang === 'es'), 'EN: título y descripción del recuadro con lang="es"')
    await page.close()
    page = await abrir(browser, { slug: 'p13', viewport: CELU, lang: 'en' })
    ok(/swipe for more · tap one/.test(await hint(page)), 'celular: texto en inglés')
    {
      const c = await cortesDeTitulos(page)
      ok(c.malas.length === 0, 'EN 390: ninguna palabra larga de letras se corta en seco ni desborda (el contenido es español: se silabea igual)', JSON.stringify(c))
      ok(c.largas > 0 && c.partidas > 0, 'EN 390: hay palabras largas y se parten con guion (el caso se está probando)', JSON.stringify(c))
      ok(await page.$$eval('.kt-innov-ficha .min-w-0', (ts) => ts.some((t) => t.textContent.includes('­'))), 'EN: los títulos llevan guiones suaves')
    }
    ok(await page.$eval('.kt-innov-punto', (p) => /Go to page 1 of 3/.test(p.getAttribute('aria-label'))), 'puntos con aria-label en inglés')
    await page.close()
    // el idioma queda en localStorage del navegador: este escenario va al final para no contaminar a los de arriba
    page = await abrir(browser, { slug: 'sd13', viewport: COMPU, lang: 'en' })
    ok((await hint(page)).trim() === '13 innovations', 'EN, ninguna con descripción: «13 innovations» y nada más')
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
