import http from 'node:http'
import { defaultLandingContent } from '../src/data/landingData.js'

const PORT = Number(process.env.PORT || 3000)

const routes = {
  '/api/landing': () => defaultLandingContent,
  '/api/landing/brand': () => defaultLandingContent.brand,
  '/api/landing/nav': () => defaultLandingContent.nav,
  '/api/landing/hero': () => defaultLandingContent.hero,
  '/api/landing/gallery': () => defaultLandingContent.gallery,
  '/api/landing/products': () => defaultLandingContent.products,
  '/api/landing/shop': () => defaultLandingContent.shop,
  '/api/landing/services': () => defaultLandingContent.services,
  '/api/landing/support': () => defaultLandingContent.support,
  '/api/landing/action': () => defaultLandingContent.action,
  '/api/landing/footer': () => defaultLandingContent.footer,
  '/api/products': () => defaultLandingContent.products.items,
  '/api/health': () => ({ status: 'ok' }),
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const handler = routes[url.pathname]

  if (!handler) {
    sendJson(res, 404, { error: `Not found: ${url.pathname}` })
    return
  }

  sendJson(res, 200, handler())
})

server.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`)
})
