/**
 * Sitemap generator — corre en `prebuild` y escribe public/sitemap.xml.
 *
 * Hoy lee desde la capa src/data/ (que envuelve los mocks). Cuando los
 * productos vengan de la API, esa misma capa hará fetch y este script
 * recibirá las URLs reales sin cambios.
 *
 * Cómo extender en Fase 5:
 *   const products = await getProducts({ revalidate: true })
 *   const guides   = await getGuides()
 */

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listStaticRoutes, listGuideRoutes } from '../src/data/routes.mjs'

/* Las categorias y los productos YA NO salen de src/data/ (los mocks). Salian de ahi
   y el resultado era un sitemap de mentira: de 8 categorias listadas 7 no existian
   (`cabezales-moviles`, `wash-flood`, `beam-spot`…) y los 2 productos eran demo
   (`kt-x1000-flood`), mientras que las 11 categorias reales y los 56 productos reales
   NO figuraban. O sea que a Google le daba una lista de URLs rotas y le escondia el
   catalogo entero. Medido contra produccion el 2026-09-02.
   Ahora se piden a la API publica, que es la misma fuente que consume el sitio. */
const API = process.env.VITE_API_BASE_URL || 'https://api.soytiendita.store/api'

async function pedir(ruta, host) {
  const res = await fetch(`${API}/public/${ruta}`, { headers: { 'X-Account-Host': host, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${ruta}: HTTP ${res.status}`)
  const d = await res.json()
  return Array.isArray(d) ? d : (d.data || d[ruta] || [])
}

// kolortec.com redirige 301 a kolortec.com.ar (ver vercel.json).
// Override con SITE_URL si cambia el primario.
const SITE = process.env.SITE_URL || 'https://kolortec.com.ar'

function urlEntry({ path, lastmod, changefreq = 'weekly', priority = 0.7 }) {
  const loc = `${SITE}${path}`
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

async function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10)

  const staticEntries = listStaticRoutes().map((route) =>
    urlEntry({
      path: route.path,
      lastmod: today,
      changefreq: route.changefreq || 'weekly',
      priority: route.priority ?? (route.path === '/' ? 1.0 : 0.8),
    }),
  )

  // El tenant sale del propio SITE: es el dominio con el que la API resuelve la cuenta.
  const host = SITE.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const [categorias, productos] = await Promise.all([pedir('categorias', host), pedir('productos', host)])

  const categoryEntries = categorias
    .filter((c) => c?.slug)
    .map((c) => urlEntry({ path: `/products/${c.slug}`, lastmod: today, changefreq: 'weekly', priority: 0.7 }))

  // El detalle de producto se resuelve por ID: la API no emite `slug` para productos
  // y el sitio enlaza `/producto/<id>` (verificado en produccion).
  const productEntries = productos
    .filter((p) => p?.id)
    .map((p) => urlEntry({ path: `/producto/${p.id}`, lastmod: today, changefreq: 'monthly', priority: 0.6 }))

  console.log(`[sitemap] catalogo real: ${categoryEntries.length} categorias, ${productEntries.length} productos`)

  const guideEntries = listGuideRoutes().map((slug) =>
    urlEntry({ path: `/soporte/guias/${slug}`, lastmod: today, changefreq: 'monthly', priority: 0.6 }),
  )

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...guideEntries,
    '</urlset>',
    '',
  ].join('\n')

  const here = dirname(fileURLToPath(import.meta.url))
  const outPath = resolve(here, '..', 'public', 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf8')

  const totalEntries =
    staticEntries.length + categoryEntries.length + productEntries.length + guideEntries.length
  console.log(`[sitemap] wrote ${outPath} with ${totalEntries} URLs`)
}

buildSitemap().catch((err) => {
  console.error('[sitemap] generation failed:', err)
  process.exit(1)
})
