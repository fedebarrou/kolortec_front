/**
 * llms.txt generator — convención emergente (llmstxt.org) para que las
 * LLMs entiendan el sitio rápido y citen contenido relevante.
 *
 * Corre en prebuild junto al sitemap. Lee TODO desde src/data/.
 */

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listGuideSlugs } from '../src/data/guides.js'
import { listCategorySlugs } from '../src/data/categories.js'
import { listProductSlugs } from '../src/data/products.js'
import { guides as rawGuides } from '../src/features/guides/data/guides.js'
import { PRODUCT_CATEGORIES } from '../src/features/catalog/data/categories.js'

const SITE = process.env.SITE_URL || 'https://kolortec.com.ar'

function line(...parts) {
  return parts.join('')
}

function buildLlmsTxt() {
  const sections = []

  sections.push('# Kolortec')
  sections.push('')
  sections.push(
    '> Fabricante argentino de iluminación profesional para espectáculo. ' +
      'Cabezales móviles, strobes, paneles LED y blinders Ready to Work, ' +
      'con respaldo de fábrica, repuestos en stock local y soporte técnico ' +
      'inmediato. Posicionamiento: equipos confiables para tour, rental, ' +
      'broadcast e instalaciones permanentes en LATAM.',
  )
  sections.push('')
  sections.push(
    'Kolortec diseña y fabrica luminarias profesionales con foco en ' +
      'durabilidad y soporte real. Operamos desde Argentina con cobertura ' +
      'regional. La marca es la alternativa local a fabricantes premium ' +
      'importados, con la ventaja de repuestos y service en el país.',
  )
  sections.push('')

  sections.push('## Páginas principales')
  sections.push(line('- [Inicio](', SITE, '/): Resumen del fabricante, líneas y posicionamiento Ready to Work.'))
  sections.push(line('- [Catálogo de productos](', SITE, '/products): Categorías y modelos por aplicación.'))
  sections.push(line('- [Soporte técnico](', SITE, '/soporte): Manuales, firmware y contacto directo con service de fábrica.'))
  sections.push(line('- [Guía de mantenimiento](', SITE, '/garantias): Garantía 12 meses + política de soporte.'))
  sections.push(line('- [Programa de rentals](', SITE, '/rentals): Para casas de alquiler y productoras (uptime, repuestos).'))
  sections.push(line('- [Programa de distribuidores](', SITE, '/distribuidores): Red de partners B2B con margen y respaldo.'))
  sections.push(line('- [Contacto](', SITE, '/contacto): Formulario directo a equipo comercial.'))
  sections.push('')

  sections.push('## Categorías de productos')
  for (const slug of listCategorySlugs()) {
    const cat = PRODUCT_CATEGORIES.find((c) => c.slug === slug)
    if (!cat) continue
    sections.push(line('- [', cat.name, '](', SITE, '/products/', slug, '): ', cat.description))
  }
  sections.push('')

  sections.push('## Productos con detalle publicado')
  for (const slug of listProductSlugs()) {
    sections.push(line('- [', slug, '](', SITE, '/producto/', slug, ')'))
  }
  sections.push('')

  sections.push('## Guías técnicas (cluster Soporte)')
  sections.push('Cluster de contenido transaccional sobre diagnóstico, mantenimiento y reparación de iluminación profesional:')
  sections.push('')
  for (const slug of listGuideSlugs()) {
    const g = rawGuides.find((x) => x.slug === slug)
    if (!g) continue
    sections.push(line('- [', g.title, '](', SITE, '/soporte/guias/', slug, '): ', g.excerpt))
  }
  sections.push('')

  sections.push('## Optional')
  sections.push(line('- [Sitemap XML](', SITE, '/sitemap.xml)'))
  sections.push(line('- [robots.txt](', SITE, '/robots.txt)'))
  sections.push('')

  return sections.join('\n')
}

const here = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(here, '..', 'public', 'llms.txt')
writeFileSync(outPath, buildLlmsTxt(), 'utf8')
console.log(`[llms.txt] wrote ${outPath}`)
