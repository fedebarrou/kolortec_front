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

import { listStaticRoutes, listProductRoutes, listCategoryRoutes, listGuideRoutes } from '../src/data/routes.mjs'

const SITE = 'https://kolortec.com.ar'

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

  const categoryEntries = listCategoryRoutes().map((slug) =>
    urlEntry({ path: `/products/${slug}`, lastmod: today, changefreq: 'weekly', priority: 0.7 }),
  )

  const productEntries = listProductRoutes().map((slug) =>
    urlEntry({ path: `/producto/${slug}`, lastmod: today, changefreq: 'monthly', priority: 0.6 }),
  )

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
