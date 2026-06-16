/**
 * Pre-render postbuild — sirve `dist/` y captura HTML rendereado por ruta.
 *
 * Por qué un script custom y no react-snap:
 *   react-snap bundlea Puppeteer 1.20 (Chrome 73) y no parsea
 *   bundles modernos generados por Vite 8 + React 19.
 *   Usamos puppeteer moderno (Chrome estable) y nuestra lista de rutas
 *   centralizada en src/data/routes.mjs (Fase 5-ready).
 */

import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listAllRoutes } from '../src/data/routes.mjs'

/**
 * Resuelve puppeteer + opciones de launch según el entorno.
 *
 * - Local (tu PC): `puppeteer` completo, que trae su propio Chrome.
 * - Vercel/serverless: el contenedor de build no tiene las librerías de
 *   sistema que necesita el Chrome de Puppeteer (libnspr4.so, etc.), así que
 *   usamos `puppeteer-core` + el binario de `@sparticuz/chromium`, que sí las
 *   incluye. Se activa con la env `VERCEL` (presente en todo build de Vercel).
 */
async function getBrowserLauncher() {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default
    return {
      puppeteer,
      launchOptions: {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      },
    }
  }

  const puppeteer = (await import('puppeteer')).default
  return {
    puppeteer,
    launchOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  }
}

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(HERE, '..', 'dist')
const PORT = 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function serve() {
  const indexHtml = readFileSync(join(DIST, 'index.html'))
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost')
        let filePath = join(DIST, decodeURIComponent(url.pathname))
        if (existsSync(filePath) && !filePath.endsWith('/') && extname(filePath)) {
          const data = readFileSync(filePath)
          res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
          res.end(data)
          return
        }
        // SPA fallback: cualquier ruta sin extensión → index.html
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(indexHtml)
      } catch (err) {
        res.writeHead(500)
        res.end(String(err))
      }
    })
    server.listen(PORT, '127.0.0.1', () => resolveServer(server))
  })
}

async function snapshot(browser, route) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 })
  page.on('pageerror', (err) => console.warn(`  [page error ${route}]`, err.message))

  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 })
  // Margen para suspense/lazy/animaciones
  await new Promise((r) => setTimeout(r, 800))

  const html = await page.evaluate(() => {
    // Limpiar atributos React específicos antes de serializar
    return '<!doctype html>\n' + document.documentElement.outerHTML
  })

  await page.close()

  const outDir = route === '/' ? DIST : join(DIST, route)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html, 'utf8')
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('[pre-render] dist/ not found; run `vite build` first')
    process.exit(1)
  }

  const routes = Array.from(new Set(listAllRoutes()))
  console.log(`[pre-render] snapshotting ${routes.length} routes from dist/`)

  const { puppeteer, launchOptions } = await getBrowserLauncher()

  const server = await serve()
  let browser
  try {
    browser = await puppeteer.launch(launchOptions)

    for (const route of routes) {
      const t0 = Date.now()
      try {
        await snapshot(browser, route)
        console.log(`  ✓ ${route} (${Date.now() - t0}ms)`)
      } catch (err) {
        console.error(`  ✗ ${route}:`, err.message)
      }
    }
  } finally {
    if (browser) await browser.close()
    server.close()
  }

  console.log('[pre-render] done')
}

main().catch((err) => {
  console.error('[pre-render] failed:', err)
  process.exit(1)
})
