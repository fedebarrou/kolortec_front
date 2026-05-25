/**
 * Bloques JSON-LD reutilizables.
 * Cualquier campo nuevo (ej. precios desde la API) se suma acá y se inyecta
 * via <Seo jsonLd={...}/>.
 */

import { SITE } from './Seo.jsx'

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}#organization`,
  name: 'Kolortec',
  legalName: 'Kolortec Lighting Systems',
  alternateName: ['Kolortec Lighting', 'KOLORTEC'],
  url: SITE,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE}/assets/logo_minimal.png`,
    width: 512,
    height: 512,
  },
  image: `${SITE}/assets/hero-bg-kolortec-rain.jpeg`,
  description:
    'Fabricante argentino de iluminación profesional para espectáculo. Cabezales móviles, strobes, paneles LED y blinders Ready to Work, con respaldo de fábrica, repuestos en stock local y soporte técnico inmediato.',
  slogan: 'Ready to Work.',
  foundingDate: '2011',
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
    },
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AR',
    addressRegion: 'Buenos Aires',
  },
  areaServed: [
    { '@type': 'Country', name: 'Argentina' },
    { '@type': 'Country', name: 'Brasil' },
    { '@type': 'Country', name: 'Chile' },
    { '@type': 'Country', name: 'México' },
    { '@type': 'Country', name: 'Uruguay' },
    { '@type': 'Country', name: 'Paraguay' },
  ],
  knowsAbout: [
    'Iluminación profesional',
    'Iluminación de espectáculo',
    'Cabezales móviles',
    'Wash LED',
    'Beam LED',
    'Strobes',
    'Paneles LED',
    'DMX',
    'Iluminación arquitectural',
    'Servicio técnico de iluminación',
    'Repuestos de iluminación profesional',
  ],
  industry: 'Professional Lighting Manufacturing',
  // TODO: completar con teléfono y email reales cuando estén confirmados.
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      areaServed: 'AR',
      availableLanguage: ['Spanish', 'English'],
      url: `${SITE}/soporte`,
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      areaServed: ['AR', 'LATAM'],
      availableLanguage: ['Spanish', 'English'],
      url: `${SITE}/contacto`,
    },
  ],
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
