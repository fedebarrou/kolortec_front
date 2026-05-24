/**
 * Bloques JSON-LD reutilizables.
 * Cualquier campo nuevo (ej. precios desde la API) se suma acá y se inyecta
 * via <Seo jsonLd={...}/>.
 */

import { SITE } from './Seo.jsx'

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kolortec',
  url: SITE,
  logo: `${SITE}/assets/logo_minimal.png`,
  description:
    'Fabricante argentino de iluminación profesional para espectáculo. Cabezales móviles, strobes y paneles LED con respaldo, repuestos y soporte técnico local.',
  areaServed: 'AR',
  sameAs: [
    'https://www.instagram.com/kolortec',
    'https://www.facebook.com/kolortec',
  ],
}

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kolortec',
  url: SITE,
  inLanguage: 'es-AR',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE}/products?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export function productJsonLd({
  name,
  description,
  image,
  sku,
  category,
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? [image] : undefined,
    sku,
    category,
    brand: { '@type': 'Brand', name: 'Kolortec' },
    manufacturer: { '@type': 'Organization', name: 'Kolortec' },
    url,
  }
}

export function articleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: 'es-AR',
    author: { '@type': 'Organization', name: 'Kolortec' },
    publisher: {
      '@type': 'Organization',
      name: 'Kolortec',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo_minimal.png` },
    },
    mainEntityOfPage: url,
  }
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
