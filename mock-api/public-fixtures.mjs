/**
 * public-fixtures.mjs — la API PÚBLICA de tiendita simulada, para verificar pantallas sin backend.
 *
 * Cubre lo que necesitan «En obra» (media asociada al producto) y «Marcas» (tamaño por área + escala):
 *   GET /api/public/productos                    → 3 productos (con media, sólo fotos, sin media)
 *   GET /api/public/galeria?producto_id=<id>     → [{ id, tipo: 'imagen'|'video', url, titulo, destacado }]
 *   GET /api/public/marcas                       → [{ nombre, logo_url, link, orden, escala }]
 *   GET /img/<ancho>x<alto>/<texto>.svg          → imagen de relleno
 *   GET /logo/<nombre>.svg                       → logos de proporciones muy distintas
 *   GET /video/obra.mp4                          → un mp4 real (el de public/assets)
 * El resto de /api/public/* responde vacío o 404; el cliente cae a sus fallbacks.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const VIDEO = resolve(aqui, '../public/assets/shop-section-bg.mp4')

const COLORES = ['#c7a600', '#2f6fed', '#d2452b', '#2a9d6f', '#8a4fd6', '#c2417a', '#3d4d5c']
const img = (origin, w, h, texto, i = 0) =>
  `${origin}/img/${w}x${h}/${encodeURIComponent(texto)}.svg?c=${i % COLORES.length}`

const OBRA = (origin) => [
  { id: 101, tipo: 'imagen', url: img(origin, 1200, 800, 'Cierre con haces amarillos', 0), titulo: 'Cierre con haces amarillos sobre el público', destacado: true },
  { id: 102, tipo: 'video', url: `${origin}/video/obra.mp4`, titulo: 'Bajo lluvia: haz abierto en exterior', destacado: false },
  { id: 103, tipo: 'imagen', url: img(origin, 1600, 900, 'Abanico de haces', 2), titulo: 'Abanico de haces desde la parrilla', destacado: false },
  { id: 104, tipo: 'imagen', url: img(origin, 900, 1200, 'Desde el costado', 3), titulo: 'Desde el costado del escenario', destacado: false },
  { id: 105, tipo: 'video', url: `${origin}/video/obra.mp4`, titulo: 'Barrido CMY a pleno, 24 equipos', destacado: false },
  { id: 106, tipo: 'video', url: `${origin}/video/obra.mp4`, titulo: 'Montaje: truss lateral, primera prueba', destacado: false },
  { id: 107, tipo: 'imagen', url: img(origin, 1200, 800, 'Escenario con pantalla', 6), titulo: 'Escenario con pantalla Kolortec', destacado: false },
]

const SOLO_FOTOS = (origin) => OBRA(origin).filter((m) => m.tipo === 'imagen').slice(0, 3)

const producto = (id, nombre, extra = {}) => ({
  id,
  slug: id,
  nombre,
  nombre_visible: nombre,
  descripcion: 'Cabeza móvil spot con mezcla de color CMY y rueda de gobos.',
  categoria: 'cabezas-moviles',
  precio: null,
  moneda: 'ARS',
  media: [],
  specs: [{ nombre: 'Fuente', valor: 'LED 300 W' }],
  docs: [],
  variantes: [],
  badges: [],
  ...extra,
})

const PRODUCTOS = (origin) => [
  producto('hs1', 'HOT SPOT CMY', {
    img_url: img(origin, 1200, 900, 'HOT SPOT CMY', 0),
    media: [
      { kind: 'image', url: img(origin, 1200, 900, 'HOT SPOT CMY', 0) },
      { kind: 'image', url: img(origin, 1200, 900, 'HOT SPOT CMY 2', 3) },
      { kind: 'video', url: `${origin}/video/obra.mp4` },
    ],
    docs: [{ title: 'Manual', url: `${origin}/doc.pdf`, size: 598000, extension: 'pdf', tipo: 'manual' }],
  }),
  producto('fotos', 'LINEPAR', { img_url: img(origin, 1200, 900, 'LINEPAR', 1) }),
  producto('vacio', 'BLINDER 74', { img_url: img(origin, 1200, 900, 'BLINDER 74', 4) }),
]

// Logos: proporciones que rompen el alto fijo (ancho/alto = 6, 1, 2.5, 4, 0.8, 9).
const LOGOS = [
  ['rotaflex', 6, 'ROTAFLEX', '#e4572e', 1],
  ['ombu', 1, 'OMBÚ', '#2f855a', 1],
  ['printmax', 2.5, 'PRINTMAX', '#7c3aed', 1],
  ['tintas', 4, 'Tintas Andinas', '#2563eb', 1.25],
  ['delta', 0.8, 'DELTA', '#dc2626', 0.85],
  ['linea', 9, 'LINEA LARGA', '#0e7490', 1],
]
const MARCAS = (origin) =>
  LOGOS.map(([clave, , nombre, , escala], i) => ({
    id: i + 1,
    nombre,
    logo_url: `${origin}/logo/${clave}.svg`,
    link: `https://example.com/${clave}`,
    orden: i,
    escala,
  }))

function svgImagen(w, h, texto, c) {
  const col = COLORES[Number(c) % COLORES.length] || COLORES[0]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101010"/><stop offset="1" stop-color="${col}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.18}" fill="#f4df33" opacity=".85"/><text x="${w * 0.06}" y="${h * 0.9}" font-family="Arial Black,Arial,sans-serif" font-size="${Math.round(h * 0.07)}" fill="#fff">${texto}</text></svg>`
}

function svgLogo(clave) {
  const fila = LOGOS.find((l) => l[0] === clave) || LOGOS[0]
  const [, r, nombre, color] = fila
  const h = 60
  const w = Math.round(h * r)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="6" fill="${color}"/><text x="${w / 2}" y="${h / 2 + 7}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${Math.min(22, Math.round(w / Math.max(nombre.length, 3) * 1.4))}" fill="#fff">${nombre}</text></svg>`
}

/** Devuelve true si atendió la request. `origin` = http://host:puerto del propio mock. */
export function handlePublic(req, res, url, origin, sendJson) {
  const p = url.pathname
  if (p === '/api/public/productos') return sendJson(res, 200, PRODUCTOS(origin)), true
  if (p === '/api/public/marcas') return sendJson(res, 200, MARCAS(origin)), true
  if (p === '/api/public/galeria') {
    const id = url.searchParams.get('producto_id')
    const body = id === 'hs1' ? OBRA(origin) : id === 'fotos' ? SOLO_FOTOS(origin) : id ? [] : []
    return sendJson(res, 200, body), true
  }
  if (p === '/api/public/web-config') return sendJson(res, 200, { published: true, show_prices: false, show_reviews: false }), true
  if (p === '/api/public/categorias' || p === '/api/public/blog' || p === '/api/public/instagram/feed') return sendJson(res, 200, []), true
  if (p.startsWith('/api/public/')) return sendJson(res, 404, { error: `Not mocked: ${p}` }), true

  let m = /^\/img\/(\d+)x(\d+)\/(.+)\.svg$/.exec(p)
  if (m) {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' })
    res.end(svgImagen(Number(m[1]), Number(m[2]), decodeURIComponent(m[3]), url.searchParams.get('c') ?? 0))
    return true
  }
  m = /^\/logo\/([a-z]+)\.svg$/.exec(p)
  if (m) {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' })
    res.end(svgLogo(m[1]))
    return true
  }
  if (p === '/video/obra.mp4' && existsSync(VIDEO)) {
    res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': statSync(VIDEO).size, 'Access-Control-Allow-Origin': '*', 'Accept-Ranges': 'none' })
    createReadStream(VIDEO).pipe(res)
    return true
  }
  return false
}
